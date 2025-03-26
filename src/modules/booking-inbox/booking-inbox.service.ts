import { Injectable, OnModuleInit } from '@nestjs/common';
import * as IMAP from 'node-imap';
import { simpleParser } from 'mailparser';
import { EntityManager } from 'typeorm';
import { Transaction } from '../../entities/transaction.entity';
import { LogService } from '../log/log.service';
import { LOG_LEVEL } from '../../constants';

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
            this.logService.log({
                level: LOG_LEVEL.ERROR,
                module: this.BOOKING_INBOX_MODULE_NAME,
                action: BOOKING_INBOX_ACTION.CONNECT,
                message: 'IMAP bağlantı hatası',
                details: err,
                entityType: this.BOOKING_INBOX_ENTITY_TYPE,
            });
        });
    }

    /**
     * Uygulama başladığında çalışır
     */
    async onModuleInit() {
        await this.logService.log({
            level: LOG_LEVEL.INFO,
            module: this.BOOKING_INBOX_MODULE_NAME,
            action: BOOKING_INBOX_ACTION.CHECK,
            message: 'Uygulama başladı, ilk e-posta kontrolü yapılıyor...',
            entityType: this.BOOKING_INBOX_ENTITY_TYPE,
        });

        // Uygulama başladığında gelen kutusunu kontrol et
        try {
            await this.fetchEmails();
        } catch (error) {
            await this.logService.log({
                level: LOG_LEVEL.ERROR,
                module: this.BOOKING_INBOX_MODULE_NAME,
                action: BOOKING_INBOX_ACTION.CHECK,
                message: 'Başlangıç e-posta kontrolü sırasında hata oluştu',
                details: error,
                stackTrace: error.stack,
                entityType: this.BOOKING_INBOX_ENTITY_TYPE,
            });
        }
    }

    /**
     * .env dosyasında belirtilen aralıklarla e-postaları kontrol et
     */
    async checkEmails() {
        await this.logService.log({
            level: LOG_LEVEL.INFO,
            module: this.BOOKING_INBOX_MODULE_NAME,
            action: BOOKING_INBOX_ACTION.CHECK,
            message: `E-postalar kontrol ediliyor (${this.emailCheckInterval} dakikada bir)...`,
            entityType: this.BOOKING_INBOX_ENTITY_TYPE,
        });

        try {
            await this.fetchEmails();
        } catch (error) {
            await this.logService.log({
                level: LOG_LEVEL.ERROR,
                module: this.BOOKING_INBOX_MODULE_NAME,
                action: BOOKING_INBOX_ACTION.CHECK,
                message: 'E-posta kontrol edilirken hata oluştu',
                details: error,
                stackTrace: error.stack,
                entityType: this.BOOKING_INBOX_ENTITY_TYPE,
            });
        }
    }

    /**
     * Manuel olarak e-postaları kontrol et
     */
    async manualCheckEmails() {
        await this.logService.log({
            level: LOG_LEVEL.INFO,
            module: this.BOOKING_INBOX_MODULE_NAME,
            action: BOOKING_INBOX_ACTION.CHECK_MANUAL,
            message: 'E-postalar manuel olarak kontrol ediliyor...',
            entityType: this.BOOKING_INBOX_ENTITY_TYPE,
        });

        try {
            await this.fetchEmails();
            return { success: true, message: 'E-postalar başarıyla kontrol edildi.' };
        } catch (error) {
            await this.logService.log({
                level: LOG_LEVEL.ERROR,
                module: this.BOOKING_INBOX_MODULE_NAME,
                action: BOOKING_INBOX_ACTION.CHECK_MANUAL,
                message: 'E-posta kontrol edilirken hata oluştu',
                details: error,
                stackTrace: error.stack,
                entityType: this.BOOKING_INBOX_ENTITY_TYPE,
            });
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
                            this.logService.log({
                                level: LOG_LEVEL.INFO,
                                module: this.BOOKING_INBOX_MODULE_NAME,
                                action: BOOKING_INBOX_ACTION.FETCH,
                                message: 'İşlenecek yeni e-posta yok.',
                                entityType: this.BOOKING_INBOX_ENTITY_TYPE,
                            });
                            this.imap.end();
                            resolve();
                            return;
                        }

                        this.logService.log({
                            level: LOG_LEVEL.INFO,
                            module: this.BOOKING_INBOX_MODULE_NAME,
                            action: BOOKING_INBOX_ACTION.FETCH,
                            message: `${results.length} adet yeni e-posta bulundu.`,
                            details: { count: results.length },
                            entityType: this.BOOKING_INBOX_ENTITY_TYPE,
                        });

                        const fetch = this.imap.fetch(results, { bodies: '', markSeen: false });
                        let processedCount = 0;

                        fetch.on('message', (msg) => {
                            msg.on('body', (stream) => {
                                // E-posta içeriğini ayrıştır
                                simpleParser(stream, async (err, mail) => {
                                    if (err) {
                                        this.logService.log({
                                            level: LOG_LEVEL.ERROR,
                                            module: this.BOOKING_INBOX_MODULE_NAME,
                                            action: BOOKING_INBOX_ACTION.PARSE,
                                            message: 'E-posta ayrıştırma hatası',
                                            details: err,
                                            stackTrace: err.stack,
                                            entityType: this.BOOKING_INBOX_ENTITY_TYPE,
                                        });
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
                                        this.logService.log({
                                            level: LOG_LEVEL.ERROR,
                                            module: this.BOOKING_INBOX_MODULE_NAME,
                                            action: BOOKING_INBOX_ACTION.PROCESS,
                                            message: 'E-posta işlenirken hata',
                                            details: e,
                                            stackTrace: e.stack,
                                            entityType: this.BOOKING_INBOX_ENTITY_TYPE,
                                        });
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
                            this.logService.log({
                                level: LOG_LEVEL.ERROR,
                                module: this.BOOKING_INBOX_MODULE_NAME,
                                action: BOOKING_INBOX_ACTION.FETCH,
                                message: 'E-posta getirme hatası',
                                details: err,
                                stackTrace: err.stack,
                                entityType: this.BOOKING_INBOX_ENTITY_TYPE,
                            });
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
        await this.logService.log({
            level: LOG_LEVEL.INFO,
            module: this.BOOKING_INBOX_MODULE_NAME,
            action: BOOKING_INBOX_ACTION.PROCESS_START,
            message: 'E-posta işleniyor...',
            details: {
                subject: mail.subject,
                from: mail.from?.text,
                date: mail.date,
            },
            entityType: this.BOOKING_INBOX_ENTITY_TYPE,
        });

        // E-posta içeriğini kontrol et
        const content = mail.text || mail.html;
        if (!content) {
            await this.logService.log({
                level: LOG_LEVEL.INFO,
                module: this.BOOKING_INBOX_MODULE_NAME,
                action: BOOKING_INBOX_ACTION.SKIP,
                message: 'E-posta içeriği boş, işlem atlanıyor.',
                details: {
                    subject: mail.subject,
                    from: mail.from?.text,
                },
                entityType: this.BOOKING_INBOX_ENTITY_TYPE,
            });
            return;
        }

        // Anahtar kelimeleri kontrol et
        const hasKeyword = this.emailKeywords.some((keyword) => content.toLowerCase().includes(keyword.toLowerCase()));

        if (!hasKeyword) {
            await this.logService.log({
                level: LOG_LEVEL.INFO,
                module: this.BOOKING_INBOX_MODULE_NAME,
                action: BOOKING_INBOX_ACTION.SKIP,
                message: 'E-posta içeriğinde anahtar kelime bulunamadı, işlem atlanıyor.',
                details: {
                    subject: mail.subject,
                    from: mail.from?.text,
                    keywords: this.emailKeywords,
                },
                entityType: this.BOOKING_INBOX_ENTITY_TYPE,
            });
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

        await this.logService.log({
            level: LOG_LEVEL.INFO,
            module: this.BOOKING_INBOX_MODULE_NAME,
            action: BOOKING_INBOX_ACTION.PROCESSED,
            message: 'E-posta başarıyla işlendi ve transaction oluşturuldu.',
            details: {
                transactionId: transaction.id,
                subject: mail.subject,
                from: mail.from?.text,
            },
            entityType: this.BOOKING_INBOX_ENTITY_TYPE,
        });
    }
}
