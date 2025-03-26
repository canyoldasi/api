import { Injectable, OnModuleInit } from '@nestjs/common';
import * as IMAP from 'node-imap';
import { simpleParser } from 'mailparser';
import { EntityManager } from 'typeorm';
import { Transaction } from '../../entities/transaction.entity';
import { LogService } from '../log/log.service';
import { LOG_LEVEL, LogLevel } from '../../constants';

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
        private logService: LogService
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

        // Anahtar kelimeleri kontrol et
        const hasKeyword = this.emailKeywords.some((keyword) => content.toLowerCase().includes(keyword.toLowerCase()));

        if (!hasKeyword) {
            await this.log(
                LOG_LEVEL.INFO,
                BOOKING_INBOX_ACTION.SKIP,
                'E-posta içeriğinde anahtar kelime bulunamadı, işlem atlanıyor.',
                {
                    subject: mail.subject,
                    from: mail.from?.text,
                    keywords: this.emailKeywords,
                }
            );
            return;
        }

        // Transaction oluştur
        const transaction = new Transaction();
        transaction.note = JSON.stringify({
            subject: mail.subject,
            from: mail.from?.text,
            to: mail.to?.text,
            content: content,
        });
        transaction.amount = 0; // E-posta içeriğinden meblağ çıkarılabilir
        transaction.transactionDate = mail.date;

        await this.entityManager.save(transaction);

        await this.log(
            LOG_LEVEL.INFO,
            BOOKING_INBOX_ACTION.PROCESSED,
            'E-posta başarıyla işlendi ve transaction oluşturuldu.',
            {
                transactionId: transaction.id,
                subject: mail.subject,
                from: mail.from?.text,
            }
        );
    }
}
