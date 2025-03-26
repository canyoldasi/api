import { Injectable, OnModuleInit } from '@nestjs/common';
import * as IMAP from 'node-imap';
import { simpleParser } from 'mailparser';
import { EntityManager } from 'typeorm';
import { Transaction } from '../../entities/transaction.entity';
import { LogService } from '../log/log.service';
import { LOG_LEVEL, LogLevel, CHANNEL_CODE } from '../../constants';
import { TransactionService } from '../transaction/transaction.service';

interface BookingDetails {
    bookingId?: string;
    category?: string;
    passengerCount?: number;
    pickupLocation?: string;
    dropoffLocation?: string;
    pickupDate?: Date;
    pickupTime?: string;
    distance?: string;
    passengerName?: string;
    mobileNumber?: string;
    driverSign?: string;
    driverInfo?: string;
    journeyCharge?: number;
    meetGreetCharge?: number;
    status?: 'CANCELLED' | 'UPDATED' | 'NEW';
}

// Email servis log action sabitleri
export enum BOOKING_INBOX_ACTION {
    CONNECT = 'CONNECT',
    CHECK = 'CHECK',
    CHECK_MANUAL = 'CHECK_MANUAL',
    FETCH = 'FETCH',
    PARSE = 'PARSE',
    PROCESS = 'PROCESS',
    PROCESS_START = 'PROCESS_START',
    SKIP = 'SKIP',
    PROCESSED = 'PROCESSED',
    ERROR = 'ERROR',
    INFO = 'INFO',
}

@Injectable()
export class BookingInboxService implements OnModuleInit {
    private imap: IMAP;
    private readonly emailCheckInterval: number;
    private readonly emailKeywords: string[];
    private readonly BOOKING_INBOX_MODULE_NAME = 'BookingInboxService';
    private readonly BOOKING_INBOX_ENTITY_TYPE = 'BOOKING_INBOX';

    constructor(
        private entityManager: EntityManager,
        private logService: LogService,
        private transactionService: TransactionService
    ) {
        // E-posta kontrol aralığını process.env'den al (dakika cinsinden)
        this.emailCheckInterval = parseInt(
            process.env.BL_EMAIL_CHECK_INTERVAL || '15', // Varsayılan 15 dakika
            10
        );

        // İşlem oluşturmak için aranacak anahtar kelimeleri al
        this.emailKeywords = (process.env.BL_EMAIL_KEYWORDS || 'sipariş,bağış,ödeme').split(',');

        this.imap = new IMAP({
            user: process.env.BL_EMAIL_USER,
            password: process.env.BL_EMAIL_PASSWORD,
            host: process.env.BL_EMAIL_HOST,
            port: parseInt(process.env.BL_EMAIL_PORT || '993'),
            tls: process.env.BL_EMAIL_TLS === 'true' ? true : false,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 10000,
        });

        // Hata olaylarını dinle
        this.imap.once('error', (err) => {
            this.log(LOG_LEVEL.ERROR, BOOKING_INBOX_ACTION.CONNECT, 'IMAP bağlantı hatası', err);
        });
    }

    /**
     * Log kaydı oluştur
     */
    private async log(
        level: LogLevel,
        action: BOOKING_INBOX_ACTION,
        message: string,
        details?: any,
        stackTrace?: string
    ): Promise<void> {
        await this.logService.log({
            level,
            module: this.BOOKING_INBOX_MODULE_NAME,
            action,
            message,
            details,
            stackTrace,
            entityType: this.BOOKING_INBOX_ENTITY_TYPE,
        });
    }

    /**
     * Uygulama başladığında çalışır
     */
    async onModuleInit() {
        await this.log(
            LOG_LEVEL.INFO,
            BOOKING_INBOX_ACTION.CHECK,
            'Uygulama başladı, ilk e-posta kontrolü yapılıyor...'
        );

        // Uygulama başladığında gelen kutusunu kontrol et
        try {
            await this.fetchEmails();
        } catch (error) {
            await this.log(
                LOG_LEVEL.ERROR,
                BOOKING_INBOX_ACTION.CHECK,
                'Başlangıç e-posta kontrolü sırasında hata oluştu',
                error,
                error.stack
            );
        }
    }

    /**
     * .env dosyasında belirtilen aralıklarla e-postaları kontrol et
     */
    async checkEmails() {
        await this.log(
            LOG_LEVEL.INFO,
            BOOKING_INBOX_ACTION.CHECK,
            `E-postalar kontrol ediliyor (${this.emailCheckInterval} dakikada bir)...`
        );

        try {
            await this.fetchEmails();
        } catch (error) {
            await this.log(
                LOG_LEVEL.ERROR,
                BOOKING_INBOX_ACTION.CHECK,
                'E-posta kontrol edilirken hata oluştu',
                error,
                error.stack
            );
        }
    }

    /**
     * Manuel olarak e-postaları kontrol et
     */
    async manualCheckEmails() {
        await this.log(
            LOG_LEVEL.INFO,
            BOOKING_INBOX_ACTION.CHECK_MANUAL,
            'E-postalar manuel olarak kontrol ediliyor...'
        );

        try {
            await this.fetchEmails();
            return { success: true, message: 'E-postalar başarıyla kontrol edildi.' };
        } catch (error) {
            await this.log(
                LOG_LEVEL.ERROR,
                BOOKING_INBOX_ACTION.CHECK_MANUAL,
                'E-posta kontrol edilirken hata oluştu',
                error,
                error.stack
            );
            return { success: false, message: error.message };
        }
    }

    /**
     * E-postaları getir ve işle
     */
    private async fetchEmails(): Promise<void> {
        return new Promise((resolve, reject) => {
            // IMAP sunucusuna bağlan
            this.imap.once('ready', () => {
                // INBOX klasörünü aç
                this.imap.openBox('INBOX', false, (err) => {
                    if (err) {
                        this.imap.end();
                        reject(err);
                        return;
                    }

                    // Son 3 gün içindeki tüm e-postaları al (okunmuş ve okunmamış)
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - 3);

                    this.imap.search([['SINCE', startDate]], (err, results) => {
                        if (err) {
                            this.imap.end();
                            reject(err);
                            return;
                        }

                        if (!results || results.length === 0) {
                            this.log(LOG_LEVEL.INFO, BOOKING_INBOX_ACTION.FETCH, 'İşlenecek yeni e-posta yok.');
                            this.imap.end();
                            resolve();
                            return;
                        }

                        this.log(
                            LOG_LEVEL.INFO,
                            BOOKING_INBOX_ACTION.FETCH,
                            `${results.length} adet yeni e-posta bulundu.`,
                            { count: results.length }
                        );

                        const fetch = this.imap.fetch(results, { bodies: '', markSeen: false });
                        let processedCount = 0;

                        fetch.on('message', (msg) => {
                            msg.on('body', (stream) => {
                                // E-posta içeriğini ayrıştır
                                simpleParser(stream, async (err, mail) => {
                                    if (err) {
                                        this.log(
                                            LOG_LEVEL.ERROR,
                                            BOOKING_INBOX_ACTION.PARSE,
                                            'E-posta ayrıştırma hatası',
                                            err,
                                            err.stack
                                        );
                                        processedCount++;
                                        if (processedCount === results.length) {
                                            this.imap.end();
                                            resolve();
                                        }
                                        return;
                                    }

                                    try {
                                        // E-posta içeriğini kontrol et ve gerekirse transaction oluştur
                                        await this.processEmail(mail);
                                    } catch (e) {
                                        this.log(
                                            LOG_LEVEL.ERROR,
                                            BOOKING_INBOX_ACTION.PROCESS,
                                            'E-posta işlenirken hata',
                                            e,
                                            e.stack
                                        );
                                    }
                                    processedCount++;
                                    if (processedCount === results.length) {
                                        this.imap.end();
                                        resolve();
                                    }
                                });
                            });
                        });

                        fetch.once('error', (err) => {
                            this.log(
                                LOG_LEVEL.ERROR,
                                BOOKING_INBOX_ACTION.FETCH,
                                'E-posta getirme hatası',
                                err,
                                err.stack
                            );
                            this.imap.end();
                            reject(err);
                        });
                    });
                });
            });

            this.imap.connect();
        });
    }

    /**
     * Booking.com mail içeriğini parse et
     */
    private parseBookingEmail(content: string): BookingDetails | null {
        try {
            const details: BookingDetails = {};

            // Booking ID'yi bul
            const bookingIdMatch = content.match(/Booking ID:[\s\n]*([0-9]+)/);
            if (bookingIdMatch) details.bookingId = bookingIdMatch[1];

            // Kategoriyi bul
            const categoryMatch = content.match(/Category:[\s\n]*([^\n]+)/);
            if (categoryMatch) details.category = categoryMatch[1].trim();

            // Yolcu sayısını bul
            const passengerMatch = content.match(/Number of Passengers:[\s\n]*([0-9]+)/);
            if (passengerMatch) details.passengerCount = parseInt(passengerMatch[1]);

            // Lokasyonları bul
            const pickupMatch = content.match(/Pick-up location:[\s\n]*([^\n]+)/);
            if (pickupMatch) details.pickupLocation = pickupMatch[1].trim();

            const dropoffMatch = content.match(/Drop-off location:[\s\n]*([^\n]+)/);
            if (dropoffMatch) details.dropoffLocation = dropoffMatch[1].trim();

            // Tarih ve saati bul
            const dateMatch = content.match(/Pick-up date:[\s\n]*([^\n]+)/);
            if (dateMatch) details.pickupDate = new Date(dateMatch[1].trim());

            const timeMatch = content.match(/Pick-up time:[\s\n]*([0-9:]+)/);
            if (timeMatch) details.pickupTime = timeMatch[1];

            // Mesafeyi bul
            const distanceMatch = content.match(/Distance:[\s\n]*([^\n]+)/);
            if (distanceMatch) details.distance = distanceMatch[1].trim();

            // Yolcu bilgilerini bul
            const nameMatch = content.match(/Name:[\s\n]*([^\n]+)/);
            if (nameMatch) details.passengerName = nameMatch[1].trim();

            const mobileMatch = content.match(/Mobile number:[\s\n]*([^\n]+)/);
            if (mobileMatch) details.mobileNumber = mobileMatch[1].trim();

            // Sürücü bilgilerini bul
            const driverSignMatch = content.match(/Driver's sign will read:[\s\n]*([^\n]+)/);
            if (driverSignMatch) details.driverSign = driverSignMatch[1].trim();

            const driverInfoMatch = content.match(/Information for driver:[\s\n]*([^\n]+)/);
            if (driverInfoMatch) details.driverInfo = driverInfoMatch[1].trim();

            // Ücret bilgilerini bul
            const journeyMatch = content.match(/Journey charge:[\s\n]*EUR ([0-9.]+)/);
            if (journeyMatch) details.journeyCharge = parseFloat(journeyMatch[1]);

            const meetGreetMatch = content.match(/Meet & greet charge:[\s\n]*EUR ([0-9.]+)/);
            if (meetGreetMatch) details.meetGreetCharge = parseFloat(meetGreetMatch[1]);

            // İptal durumunu kontrol et
            if (content.includes('cancelled their booking')) {
                details.status = 'CANCELLED';
            } else if (content.includes('updated their')) {
                details.status = 'UPDATED';
            } else {
                details.status = 'NEW';
            }

            return details;
        } catch (error) {
            console.error('Error parsing booking email:', error);
            return null;
        }
    }

    /**
     * E-posta içeriğini işle ve gerekirse transaction oluştur
     */
    private async processEmail(mail: any): Promise<void> {
        await this.log(LOG_LEVEL.INFO, BOOKING_INBOX_ACTION.PROCESS_START, 'E-posta işleniyor...', {
            subject: mail.subject,
            from: mail.from?.text,
            date: mail.date,
        });

        // E-posta içeriğini kontrol et
        const content = mail.text || mail.html;
        if (!content) {
            await this.log(LOG_LEVEL.INFO, BOOKING_INBOX_ACTION.SKIP, 'E-posta içeriği boş, işlem atlanıyor.', {
                subject: mail.subject,
                from: mail.from?.text,
            });
            return;
        }

        // Booking.com'dan gelen mail mi kontrol et
        if (!mail.from?.text?.toLowerCase().includes('booking.com')) {
            await this.log(LOG_LEVEL.INFO, BOOKING_INBOX_ACTION.SKIP, 'Booking.com maili değil, işlem atlanıyor.', {
                subject: mail.subject,
                from: mail.from?.text,
            });
            return;
        }

        // Mail içeriğini parse et
        const bookingDetails = this.parseBookingEmail(content);
        if (!bookingDetails) {
            await this.log(LOG_LEVEL.ERROR, BOOKING_INBOX_ACTION.PARSE, 'Mail içeriği parse edilemedi', {
                subject: mail.subject,
                from: mail.from?.text,
            });
            return;
        }

        // Booking.com kanalını bul
        const channels = await this.transactionService.getChannelsLookup();
        const bookingChannel = channels.find((channel) => channel.code === CHANNEL_CODE.BOOKING);
        if (!bookingChannel) {
            await this.log(LOG_LEVEL.ERROR, BOOKING_INBOX_ACTION.PROCESS, 'Booking.com kanalı bulunamadı', {
                subject: mail.subject,
                from: mail.from?.text,
            });
            return;
        }

        // Transaction oluştur
        const transaction = new Transaction();
        transaction.externalReferenceId = bookingDetails.bookingId;
        transaction.channel = bookingChannel;
        transaction.note = JSON.stringify({
            subject: mail.subject,
            from: mail.from?.text,
            to: mail.to?.text,
            bookingDetails: bookingDetails,
        });
        transaction.amount = (bookingDetails.journeyCharge || 0) + (bookingDetails.meetGreetCharge || 0);
        transaction.transactionDate = bookingDetails.pickupDate || mail.date;

        await this.entityManager.save(transaction);

        await this.log(
            LOG_LEVEL.INFO,
            BOOKING_INBOX_ACTION.PROCESSED,
            'E-posta başarıyla işlendi ve transaction oluşturuldu.',
            {
                transactionId: transaction.id,
                externalReferenceId: transaction.externalReferenceId,
                channelId: bookingChannel.id,
                subject: mail.subject,
                from: mail.from?.text,
                status: bookingDetails.status,
            }
        );
    }
}
