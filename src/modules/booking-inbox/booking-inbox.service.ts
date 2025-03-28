import { Injectable, OnModuleInit } from '@nestjs/common';
import * as IMAP from 'node-imap';
import { simpleParser } from 'mailparser';
import { EntityManager } from 'typeorm';
import { LogService } from '../log/log.service';
import { LOG_LEVEL, LogLevel } from '../../constants';
import { TransactionService } from '../transaction/transaction.service';
import { CreateUpdateTransactionDTO } from '../transaction/dto/create-update-transaction.dto';
import { ParsedMail } from 'mailparser';
import { TransactionStatus } from '../../entities/transaction-status.entity';

enum BookingEmailType {
    NEW_CONFIRMATION = 'NEW_CONFIRMATION',
    UPDATED = 'UPDATED',
    FLIGHT_INFO_CHANGED = 'FLIGHT_INFO_CHANGED',
    FREE_CANCELLATION = 'FREE_CANCELLATION',
}

interface BookingDetails {
    bookingId: string;
    type: BookingEmailType;
    category?: string;
    passengerCount?: number;
    pickupLocation?: string;
    dropoffLocation?: string;
    pickupDate?: Date;
    pickupTime?: string;
    distance?: string;
    passengerName?: string;
    passengerPhone?: string;
    driverNotes?: string;
    amount?: number;
    currency?: string;
    flightNumber?: string;
    originAirport?: string;
    updatedFields?: Record<string, string>;
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
    private parseBookingEmail(mail: ParsedMail): BookingDetails {
        const details: BookingDetails = {
            bookingId: '',
            type: BookingEmailType.NEW_CONFIRMATION,
        };

        // Determine email type from subject
        if (mail.subject.includes('booking NEW confirmation')) {
            details.type = BookingEmailType.NEW_CONFIRMATION;
        } else if (mail.subject.includes('Flight information has changed')) {
            details.type = BookingEmailType.FLIGHT_INFO_CHANGED;
        } else if (mail.subject.includes('free cancellation')) {
            details.type = BookingEmailType.FREE_CANCELLATION;
        } else if (mail.subject.includes('updated')) {
            details.type = BookingEmailType.UPDATED;
        }

        // Extract booking ID
        const bookingIdMatch = mail.text.match(/Booking ID:?\s*#?(\d+)/i);
        if (bookingIdMatch) {
            details.bookingId = bookingIdMatch[1];
        }

        // Parse based on email type
        switch (details.type) {
            case BookingEmailType.NEW_CONFIRMATION:
                return this.parseNewConfirmation(mail.text, details);
            case BookingEmailType.FLIGHT_INFO_CHANGED:
                return this.parseFlightInfoChanged(mail.text, details);
            case BookingEmailType.UPDATED:
                return this.parseUpdatedBooking(mail.text, details);
            case BookingEmailType.FREE_CANCELLATION:
                return this.parseFreeCancellation(mail.text, details);
            default:
                return details;
        }
    }

    private parseNewConfirmation(content: string, details: BookingDetails): BookingDetails {
        const parsedDetails = { ...details };

        // Category
        const categoryMatch = content.match(/Category:\s*\*([^*]+)\*/i);
        if (categoryMatch) {
            parsedDetails.category = categoryMatch[1];
        }

        // Passenger count
        const passengerCountMatch = content.match(/Number of Passengers:\s*\*(\d+)\*/i);
        if (passengerCountMatch) {
            parsedDetails.passengerCount = parseInt(passengerCountMatch[1]);
        }

        // Locations
        const pickupMatch = content.match(/Pick-up location:\s*([^\n]+)/i);
        if (pickupMatch) {
            parsedDetails.pickupLocation = pickupMatch[1].trim();
        }

        const dropoffMatch = content.match(/Drop-off location:\s*([^\n]+)/i);
        if (dropoffMatch) {
            parsedDetails.dropoffLocation = dropoffMatch[1].trim();
        }

        // Date and time
        const dateMatch = content.match(/Pick-up date:\s*([^\n]+)/i);
        if (dateMatch) {
            parsedDetails.pickupDate = new Date(dateMatch[1].trim());
        }

        const timeMatch = content.match(/Pick-up time:\s*([^\n]+)/i);
        if (timeMatch) {
            parsedDetails.pickupTime = timeMatch[1].trim();
        }

        // Distance
        const distanceMatch = content.match(/Distance:\s*([^\n]+)/i);
        if (distanceMatch) {
            parsedDetails.distance = distanceMatch[1].trim();
        }

        // Passenger info
        const nameMatch = content.match(/Name:\s*([^\n]+)/i);
        if (nameMatch) {
            parsedDetails.passengerName = nameMatch[1].trim();
        }

        const phoneMatch = content.match(/Mobile number:\s*([^\n]+)/i);
        if (phoneMatch) {
            parsedDetails.passengerPhone = phoneMatch[1].trim();
        }

        // Driver notes
        const notesMatch = content.match(/Information for driver:\s*([^\n]+)/i);
        if (notesMatch) {
            parsedDetails.driverNotes = notesMatch[1].trim();
        }

        // Amount
        const amountMatch = content.match(/Journey charge:\s*([A-Z]{3})\s*([\d.]+)/i);
        if (amountMatch) {
            parsedDetails.currency = amountMatch[1];
            parsedDetails.amount = parseFloat(amountMatch[2]);
        }

        return parsedDetails;
    }

    private parseFlightInfoChanged(content: string, details: BookingDetails): BookingDetails {
        const parsedDetails = { ...details };

        // Flight number and origin
        const flightMatch = content.match(/Flight number:\s*([^\n]+)/i);
        if (flightMatch) {
            const flightInfo = flightMatch[1].trim();
            const [number, origin] = flightInfo.split('Origin Airport');
            parsedDetails.flightNumber = number.trim();
            parsedDetails.originAirport = origin?.trim();
        }

        // Passenger name
        const nameMatch = content.match(/Name:\s*([^\n]+)/i);
        if (nameMatch) {
            parsedDetails.passengerName = nameMatch[1].trim();
        }

        // Locations
        const pickupMatch = content.match(/Pick-up location:\s*([^\n]+)/i);
        if (pickupMatch) {
            parsedDetails.pickupLocation = pickupMatch[1].trim();
        }

        const dropoffMatch = content.match(/Drop-off location:\s*([^\n]+)/i);
        if (dropoffMatch) {
            parsedDetails.dropoffLocation = dropoffMatch[1].trim();
        }

        return parsedDetails;
    }

    private parseUpdatedBooking(content: string, details: BookingDetails): BookingDetails {
        const parsedDetails = { ...details };
        parsedDetails.updatedFields = {};

        // Find the table with updated information
        const tableMatch = content.match(/<table[^>]*>[\s\S]*?<\/table>/i);
        if (tableMatch) {
            const tableContent = tableMatch[0];

            // Extract field name and new value
            const fieldMatch = tableContent.match(
                /<td[^>]*><strong>([^<]+)<\/strong><\/td>\s*<td[^>]*><strong>([^<]+)<\/strong><\/td>/i
            );
            if (fieldMatch) {
                const [, fieldName, newValue] = fieldMatch;
                parsedDetails.updatedFields[fieldName.trim()] = newValue.trim();
            }
        }

        return parsedDetails;
    }

    private parseFreeCancellation(content: string, details: BookingDetails): BookingDetails {
        // Add specific parsing for free cancellation emails if needed
        // Currently, we only need the booking ID which is already extracted
        return details;
    }

    /**
     * E-posta içeriğini işle ve gerekirse transaction oluştur
     */
    private async processEmail(mail: ParsedMail): Promise<void> {
        try {
            // Check if email is from Booking.com
            const bookingEmail = 'noreply.taxi@booking.com';
            if (!mail.from?.text.includes(bookingEmail) && !mail.text.includes(bookingEmail)) {
                console.log('Skipping non-Booking.com email:', mail.from?.text, mail.subject, mail.text);
                return;
            }

            // Parse email content
            const content = mail.text || mail.html || '';
            const bookingDetails = this.parseBookingEmail(mail);

            if (!bookingDetails.bookingId) {
                console.log('No booking ID found in email');
                return;
            }

            // Get booking channel
            const channels = await this.transactionService.getChannelsLookup();
            const bookingChannel = channels.find((channel) => channel.code === 'BOOKING');
            if (!bookingChannel) {
                console.log('Booking channel not found');
                return;
            }

            // Check for existing transaction
            const existingTransactions = await this.transactionService.getTransactionsByExternalId(
                bookingDetails.bookingId
            );
            const existingTransaction = existingTransactions[0];

            // Prepare transaction data
            const transactionData: CreateUpdateTransactionDTO = {
                channelId: bookingChannel.id,
                externalId: bookingDetails.bookingId,
                amount: bookingDetails.amount || 0,
                note: JSON.stringify({
                    subject: mail.subject,
                    content: content,
                    bookingDetails: bookingDetails,
                }),
                transactionDate: bookingDetails.pickupDate || new Date(),
                statusId: (await this.getTransactionStatus(bookingDetails.type)).id,
            };

            if (existingTransaction) {
                // Update existing transaction
                await this.transactionService.update({
                    id: existingTransaction.id,
                    ...transactionData,
                });
                console.log('Updated transaction:', {
                    id: existingTransaction.id,
                    externalId: bookingDetails.bookingId,
                    type: bookingDetails.type,
                });
            } else {
                // Create new transaction
                const newTransaction = await this.transactionService.create(transactionData);
                console.log('Created new transaction:', {
                    id: newTransaction.id,
                    externalId: bookingDetails.bookingId,
                    type: bookingDetails.type,
                });
            }
        } catch (error) {
            console.error('Error processing email:', error);
        }
    }

    private async getTransactionStatus(emailType: BookingEmailType): Promise<TransactionStatus> {
        const statuses = await this.transactionService.getTransactionStatuses();
        let statusCode: string;

        switch (emailType) {
            case BookingEmailType.NEW_CONFIRMATION:
                statusCode = 'NEW';
                break;
            case BookingEmailType.UPDATED:
                statusCode = 'UPDATED';
                break;
            case BookingEmailType.FLIGHT_INFO_CHANGED:
                statusCode = 'FLIGHT_UPDATED';
                break;
            case BookingEmailType.FREE_CANCELLATION:
                statusCode = 'CANCELLED';
                break;
            default:
                statusCode = 'NEW';
        }

        const status = statuses.find((s) => s.code === statusCode);
        if (!status) {
            throw new Error(`Transaction status not found for code: ${statusCode}`);
        }

        return status;
    }
}
