import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as IMAP from 'node-imap';
import { simpleParser } from 'mailparser';
import { EntityManager } from 'typeorm';
import { Transaction } from '../../entities/transaction.entity';
import { TransactionType } from '../../constants';
import { TransactionStatus } from '../../entities/transaction-status.entity';
import { LogService } from '../log/log.service';
import { LOG_LEVEL } from '../../constants';

// Email servis log action sabitleri
export enum EMAIL_ACTION {
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
export class EmailService implements OnModuleInit {
    private imap: IMAP;
    private readonly emailCheckInterval: number;
    private readonly emailKeywords: string[];
    private readonly cronExpression: string;
    private readonly EMAIL_MODULE_NAME = 'EmailService';
    private readonly EMAIL_ENTITY_TYPE = 'EMAIL';

    constructor(
        private entityManager: EntityManager,
        private logService: LogService
    ) {
        // E-posta kontrol aralığını process.env'den al (dakika cinsinden)
        this.emailCheckInterval = parseInt(
            process.env.BL_EMAIL_CHECK_INTERVAL || '15', // Varsayılan 15 dakika
            10
        );

        // Cron ifadesini oluştur
        this.cronExpression = `0 */${this.emailCheckInterval} * * * *`;

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
                module: this.EMAIL_MODULE_NAME,
                action: EMAIL_ACTION.CONNECT,
                message: 'IMAP bağlantı hatası',
                details: err,
                entityType: this.EMAIL_ENTITY_TYPE,
            });
        });
    }

    /**
     * Uygulama başladığında çalışır
     */
    async onModuleInit() {
        return;
        await this.logService.log({
            level: LOG_LEVEL.INFO,
            module: this.EMAIL_MODULE_NAME,
            action: EMAIL_ACTION.CHECK,
            message: 'Uygulama başladı, ilk e-posta kontrolü yapılıyor...',
            entityType: this.EMAIL_ENTITY_TYPE,
        });

        // Uygulama başladığında gelen kutusunu kontrol et
        try {
            await this.fetchEmails();
        } catch (error) {
            await this.logService.log({
                level: LOG_LEVEL.ERROR,
                module: this.EMAIL_MODULE_NAME,
                action: EMAIL_ACTION.CHECK,
                message: 'Başlangıç e-posta kontrolü sırasında hata oluştu',
                details: error,
                stackTrace: error.stack,
                entityType: this.EMAIL_ENTITY_TYPE,
            });
        }
    }

    /**
     * .env dosyasında belirtilen aralıklarla e-postaları kontrol et
     */
    @Cron('0 */1 * * * *') // Her 1 dakikada bir kontrol et
    async checkEmails() {
        return;
        await this.logService.log({
            level: LOG_LEVEL.INFO,
            module: this.EMAIL_MODULE_NAME,
            action: EMAIL_ACTION.CHECK,
            message: `E-postalar kontrol ediliyor (${this.emailCheckInterval} dakikada bir)...`,
            entityType: this.EMAIL_ENTITY_TYPE,
        });

        try {
            await this.fetchEmails();
        } catch (error) {
            await this.logService.log({
                level: LOG_LEVEL.ERROR,
                module: this.EMAIL_MODULE_NAME,
                action: EMAIL_ACTION.CHECK,
                message: 'E-posta kontrol edilirken hata oluştu',
                details: error,
                stackTrace: error.stack,
                entityType: this.EMAIL_ENTITY_TYPE,
            });
        }
    }

    /**
     * Manuel olarak e-postaları kontrol et
     */
    async manualCheckEmails() {
        await this.logService.log({
            level: LOG_LEVEL.INFO,
            module: this.EMAIL_MODULE_NAME,
            action: EMAIL_ACTION.CHECK_MANUAL,
            message: 'E-postalar manuel olarak kontrol ediliyor...',
            entityType: this.EMAIL_ENTITY_TYPE,
        });

        try {
            await this.fetchEmails();
            return { success: true, message: 'E-postalar başarıyla kontrol edildi.' };
        } catch (error) {
            await this.logService.log({
                level: LOG_LEVEL.ERROR,
                module: this.EMAIL_MODULE_NAME,
                action: EMAIL_ACTION.CHECK_MANUAL,
                message: 'E-posta kontrol edilirken hata oluştu',
                details: error,
                stackTrace: error.stack,
                entityType: this.EMAIL_ENTITY_TYPE,
            });
            return { success: false, message: error.message };
        }
    }

    /**
     * E-postaları getir ve işle
     */
    private async fetchEmails(): Promise<void> {
        return new Promise((resolve, reject) => {
            resolve();
            return;
            // IMAP sunucusuna bağlan
            this.imap.once('ready', () => {
                // INBOX klasörünü aç
                this.imap.openBox('INBOX', false, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Son 3 gün içindeki tüm e-postaları al (okunmuş ve okunmamış)
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - 3);

                    this.imap.search([['SINCE', startDate]], (err, results) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        if (!results || results.length === 0) {
                            this.logService.log({
                                level: LOG_LEVEL.INFO,
                                module: this.EMAIL_MODULE_NAME,
                                action: EMAIL_ACTION.FETCH,
                                message: 'İşlenecek yeni e-posta yok.',
                                entityType: this.EMAIL_ENTITY_TYPE,
                            });
                            this.imap.end();
                            resolve();
                            return;
                        }

                        this.logService.log({
                            level: LOG_LEVEL.INFO,
                            module: this.EMAIL_MODULE_NAME,
                            action: EMAIL_ACTION.FETCH,
                            message: `${results.length} adet yeni e-posta bulundu.`,
                            details: { count: results.length },
                            entityType: this.EMAIL_ENTITY_TYPE,
                        });

                        const fetch = this.imap.fetch(results, { bodies: '', markSeen: true });

                        fetch.on('message', (msg) => {
                            msg.on('body', (stream) => {
                                // E-posta içeriğini ayrıştır
                                simpleParser(stream, async (err, mail) => {
                                    if (err) {
                                        this.logService.log({
                                            level: LOG_LEVEL.ERROR,
                                            module: this.EMAIL_MODULE_NAME,
                                            action: EMAIL_ACTION.PARSE,
                                            message: 'E-posta ayrıştırma hatası',
                                            details: err,
                                            stackTrace: err.stack,
                                            entityType: this.EMAIL_ENTITY_TYPE,
                                        });
                                        return;
                                    }

                                    try {
                                        // E-posta içeriğini kontrol et ve gerekirse transaction oluştur
                                        await this.processEmail(mail);
                                    } catch (e) {
                                        this.logService.log({
                                            level: LOG_LEVEL.ERROR,
                                            module: this.EMAIL_MODULE_NAME,
                                            action: EMAIL_ACTION.PROCESS,
                                            message: 'E-posta işlenirken hata',
                                            details: e,
                                            stackTrace: e.stack,
                                            entityType: this.EMAIL_ENTITY_TYPE,
                                        });
                                    }
                                });
                            });
                        });

                        fetch.once('error', (err) => {
                            this.logService.log({
                                level: LOG_LEVEL.ERROR,
                                module: this.EMAIL_MODULE_NAME,
                                action: EMAIL_ACTION.FETCH,
                                message: 'E-posta getirme hatası',
                                details: err,
                                stackTrace: err.stack,
                                entityType: this.EMAIL_ENTITY_TYPE,
                            });
                            reject(err);
                        });

                        fetch.once('end', () => {
                            this.logService.log({
                                level: LOG_LEVEL.INFO,
                                module: this.EMAIL_MODULE_NAME,
                                action: EMAIL_ACTION.FETCH,
                                message: 'Tüm e-postalar işlendi.',
                                entityType: this.EMAIL_ENTITY_TYPE,
                            });
                            this.imap.end();
                            resolve();
                        });
                    });
                });
            });

            // Bağlantı hatası olayını dinle
            this.imap.once('error', (err) => {
                this.logService.log({
                    level: LOG_LEVEL.ERROR,
                    module: this.EMAIL_MODULE_NAME,
                    action: EMAIL_ACTION.CONNECT,
                    message: 'IMAP bağlantı hatası',
                    details: err,
                    stackTrace: err.stack,
                    entityType: this.EMAIL_ENTITY_TYPE,
                });
                reject(err);
            });

            // Bağlantıyı başlat
            this.imap.connect();
        });
    }

    /**
     * E-posta içeriğini işle ve gerekirse transaction oluştur
     */
    private async processEmail(mail: any): Promise<void> {
        const subject = mail.subject || '';
        const text = mail.text || '';
        const from = mail.from?.text || '';
        const messageId = mail.messageId || `no-id-${Date.now()}`;

        await this.logService.log({
            level: LOG_LEVEL.INFO,
            module: this.EMAIL_MODULE_NAME,
            action: EMAIL_ACTION.PROCESS_START,
            message: `İşleniyor: "${subject}" - Gönderen: ${from} - ID: ${messageId}`,
            entity: messageId,
            entityType: this.EMAIL_ENTITY_TYPE,
        });

        // Bu e-posta daha önce işlenmiş mi kontrol et
        const existingLogs = await this.logService.getLogs({
            action: EMAIL_ACTION.PROCESSED,
            entityType: this.EMAIL_ENTITY_TYPE,
            entity: messageId,
        });

        if (existingLogs && existingLogs.length > 0) {
            await this.logService.log({
                level: LOG_LEVEL.INFO,
                module: this.EMAIL_MODULE_NAME,
                action: EMAIL_ACTION.SKIP,
                message: `Bu e-posta daha önce işlenmiş: ${messageId}`,
                entity: messageId,
                entityType: this.EMAIL_ENTITY_TYPE,
            });
            return;
        }

        // Belirtilen anahtar kelimeleri içeriyor mu diye kontrol et
        const hasKeyword = this.emailKeywords.some(
            (keyword) =>
                subject.toLowerCase().includes(keyword.toLowerCase()) ||
                text.toLowerCase().includes(keyword.toLowerCase())
        );

        if (!hasKeyword) {
            await this.logService.log({
                level: LOG_LEVEL.INFO,
                module: this.EMAIL_MODULE_NAME,
                action: EMAIL_ACTION.SKIP,
                message: 'Bu e-posta anahtar kelime içermiyor, işlem yapılmayacak.',
                entity: messageId,
                entityType: this.EMAIL_ENTITY_TYPE,
            });
            return;
        }

        // Anahtar kelime içeriyorsa transaction oluştur
        try {
            //const transactionType = this.determineTransactionType(subject, text);
            const amount = this.extractAmount(text) || 0;

            const transaction = new Transaction();
            //transaction.type = transactionType;
            transaction.amount = amount;
            transaction.note = `E-posta konu: ${subject}\nGönderen: ${from}. E-postadan otomatik oluşturuldu. İçerik:\n${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`;
            transaction.no = `EMAIL-${Date.now()}`;

            // İlgili durum ID'sini al ve TransactionStatus nesnesini oluştur
            const statusId = await this.getInitialStatusId();

            // Durum ID'si bulunamadıysa işlemi sonlandır
            if (!statusId) {
                await this.logService.log({
                    level: LOG_LEVEL.INFO,
                    module: this.EMAIL_MODULE_NAME,
                    action: EMAIL_ACTION.SKIP,
                    message: 'İşlem durumu bulunamadığı için transaction oluşturulamadı.',
                    entity: messageId,
                    entityType: this.EMAIL_ENTITY_TYPE,
                });
                return;
            }

            const status = await this.entityManager.findOne(TransactionStatus, {
                where: { id: statusId },
            });

            if (!status) {
                await this.logService.log({
                    level: LOG_LEVEL.INFO,
                    module: this.EMAIL_MODULE_NAME,
                    action: EMAIL_ACTION.SKIP,
                    message: `Transaction durumu bulunamadı: ${statusId}`,
                    entity: messageId,
                    entityType: this.EMAIL_ENTITY_TYPE,
                });
                return;
            }

            transaction.status = status;

            await this.entityManager.save(Transaction, transaction);

            // İşlem başarılı olduğunda "PROCESSED" logunu oluştur
            await this.logService.log({
                level: LOG_LEVEL.INFO,
                module: this.EMAIL_MODULE_NAME,
                action: EMAIL_ACTION.PROCESSED,
                message: `Yeni transaction oluşturuldu: ${transaction.id}`,
                entity: messageId,
                entityType: this.EMAIL_ENTITY_TYPE,
                details: { transactionId: transaction.id },
            });
        } catch (error) {
            await this.logService.log({
                level: LOG_LEVEL.ERROR,
                module: this.EMAIL_MODULE_NAME,
                action: EMAIL_ACTION.ERROR,
                message: 'Transaction oluşturulurken hata',
                entity: messageId,
                entityType: this.EMAIL_ENTITY_TYPE,
                details: error,
                stackTrace: error.stack,
            });
            throw error;
        }
    }

    /**
     * E-posta içeriğine göre transaction tipini belirle
     */
    private determineTransactionType(subject: string, text: string): TransactionType {
        const content = (subject + ' ' + text).toLowerCase();

        if (content.includes('bağış') || content.includes('donation')) {
            return TransactionType.DONATION;
        }

        // Varsayılan olarak bağış tipini kullan
        return TransactionType.DONATION;
    }

    /**
     * E-posta içeriğinden tutarı çıkar
     */
    private extractAmount(text: string): number | null {
        // Tutar formatları için regex: 1000 TL, 1.000 TL, 1,000 TL gibi
        const amountRegex = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)(?:\s*(?:TL|USD|EUR|₺|\$|€))/i;
        const match = text.match(amountRegex);

        if (match && match[1]) {
            // Virgül ve noktaları temizle
            const amount = match[1].replace(/\./g, '').replace(/,/g, '.');
            return parseFloat(amount);
        }

        return null;
    }

    /**
     * Başlangıç durum ID'sini getir
     */
    private async getInitialStatusId(): Promise<string | null> {
        // Veritabanından işlem için başlangıç durumunu bul
        const initialStatus = await this.entityManager.findOne(TransactionStatus, {
            where: {
                isActive: true,
                sequence: 1, // En düşük sıradaki durum
            },
            order: { sequence: 'ASC' },
        });

        if (!initialStatus) {
            await this.logService.log({
                level: LOG_LEVEL.INFO,
                module: this.EMAIL_MODULE_NAME,
                action: EMAIL_ACTION.INFO,
                message: 'Sistemde tanımlı işlem durumu bulunamadı!',
                entityType: this.EMAIL_ENTITY_TYPE,
            });
            return null;
        }

        return initialStatus.id;
    }
}
