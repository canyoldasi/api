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
import * as fs from 'fs';
import * as path from 'path';
import { htmlToText } from 'html-to-text';

enum BookingEmailType {
    NEW = 'NEW',
    CANCEL = 'CANCEL',
    UPDATE = 'UPDATE',
    COMPLAINT = 'COMPLAINT',
}

interface BookingDetails {
    reservationId: string;
    emailType: BookingEmailType;
    status: 'ACTIVE' | 'CANCELLED';
    createdAt: Date;
    account: {
        fullName: string;
        phoneNumber: string;
        passengerCount: number;
    };
    transferDetails: {
        vehicleType:
            | 'STANDARD'
            | 'EXECUTIVE'
            | 'EXECUTIVE_PEOPLE_CARRIER'
            | 'PEOPLE_CARRIER'
            | 'LARGE_PEOPLE_CARRIER'
            | 'MINIBUS';
        pickupLocation: string;
        dropoffLocation: string;
        scheduledTime: string;
        price: {
            amount: number;
            currency: string;
        };
        notes?: string;
    };
    flightDetails: {
        flightNumber: string;
        direction: 'ARRIVAL' | 'DEPARTURE';
    };
    transferCompany: {
        name: string;
        email: string;
    };
    specialRequests: {
        wheelchair: boolean;
        childSeat: {
            required: boolean;
            age?: number;
        };
        nameSign: {
            required: boolean;
            text?: string;
            language?: 'ENGLISH' | 'TURKISH' | 'RUSSIAN' | 'ARABIC';
        };
        meetingPoint?: 'RECEPTION' | 'TERMINAL';
        notes?: string;
    };
    complaintDetails: {
        hasComplaint: boolean;
        complaintId?: string;
        status?: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED';
        resolution?: string;
    };
    cancellationDetails: {
        isCancelled: boolean;
        cancelledAt?: Date;
    };
    metadata: {
        emailSubject: string;
        emailFrom: string;
        emailTo: string;
    };
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
    private readonly BOOKING_INBOX_MODULE_NAME = 'BookingInboxService';
    private readonly BOOKING_INBOX_ENTITY_TYPE = 'BOOKING_INBOX';
    private bookingChannelId: string;

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
        return;
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
        console.log('Uygulama başladı, ilk e-posta kontrolü yapılıyor...');

        // Get booking channel
        const channels = await this.transactionService.getChannelsLookup();
        const bookingChannel = channels.find((channel) => channel.code === 'BOOKING');
        if (!bookingChannel) {
            throw new Error('Booking channel not found');
        }
        this.bookingChannelId = bookingChannel.id.toString();

        // Uygulama başladığında gelen kutusunu kontrol et
        try {
            await this.fetchEmails();
            console.log('Başlangıç e-posta kontrolü başarıyla tamamlandı');
        } catch (error) {
            console.error('Başlangıç e-posta kontrolü sırasında hata oluştu', error);
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
    async startScheduled() {
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
    async startManuel() {
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

                    // Belli süre içindeki tüm e-postaları al (okunmuş ve okunmamış)
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - 1);

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
                                        await this.determineEmail(mail);
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
    private processBookingEmail(mail: ParsedMail, textContent: string): BookingDetails {
        const details: BookingDetails = {
            reservationId: '',
            emailType: BookingEmailType.NEW,
            status: 'ACTIVE',
            createdAt: new Date(),
            account: {
                fullName: '',
                phoneNumber: '',
                passengerCount: 0,
            },
            transferDetails: {
                vehicleType: 'STANDARD',
                pickupLocation: '',
                dropoffLocation: '',
                scheduledTime: null,
                price: {
                    amount: 0,
                    currency: '',
                },
            },
            flightDetails: {
                flightNumber: '',
                direction: 'ARRIVAL',
            },
            transferCompany: {
                name: '',
                email: mail.to?.text || '',
            },
            specialRequests: {
                wheelchair: false,
                childSeat: {
                    required: false,
                },
                nameSign: {
                    required: false,
                },
            },
            complaintDetails: {
                hasComplaint: false,
            },
            cancellationDetails: {
                isCancelled: false,
            },
            metadata: {
                emailSubject: mail.subject || '',
                emailFrom: mail.from?.text || '',
                emailTo: mail.to?.text || '',
            },
        };

        // Determine email type from subject
        if (mail.subject?.toLowerCase().includes('new') && mail.subject?.toLowerCase().includes('reservation')) {
            details.emailType = BookingEmailType.NEW;
        } else if (mail.subject?.toLowerCase().includes('cancel')) {
            details.emailType = BookingEmailType.CANCEL;
        } else if (mail.subject?.toLowerCase().includes('update')) {
            details.emailType = BookingEmailType.UPDATE;
        } else if (
            mail.subject?.toLowerCase().includes('complaint') ||
            mail.subject?.toLowerCase().includes('investigation')
        ) {
            details.emailType = BookingEmailType.COMPLAINT;
        } else {
            throw new Error('Email type not found');
        }

        return this.parseEmailTextContent(textContent, details);
    }

    private parseEmailTextContent(textContent: string, details: BookingDetails): BookingDetails {
        const parsedDetails = { ...details };

        // Transfer Company Name
        const companyMatch = textContent.match(/Dear\s*([^,]+),/i);
        if (companyMatch) {
            parsedDetails.transferCompany.name = companyMatch[1].trim();
        }

        // Reservation ID
        const reservationIdMatch = textContent.match(/Reservation Name\s*([^\n^\s]+)\s*/i);
        if (reservationIdMatch) {
            parsedDetails.reservationId = reservationIdMatch[1].trim();
        }

        // Vehicle Type
        const vehicleTypeMatch = textContent.match(/Vehicle Type\s*([^\n^\s]+)\s*/i);
        if (vehicleTypeMatch) {
            parsedDetails.transferDetails.vehicleType = vehicleTypeMatch[1]
                .trim()
                .toUpperCase()
                .replace(/\s+/g, '_') as any;
        }

        // Pickup Location
        const pickupMatch = textContent.match(/.*From\s+(.*?)\s+To\s+.*/s);
        if (pickupMatch) {
            parsedDetails.transferDetails.pickupLocation = pickupMatch[1].trim();
        }

        // Dropoff Location
        const dropoffMatch = textContent.match(/.*To\s+(.*?)\s+Date\s+.*/s);
        if (dropoffMatch) {
            parsedDetails.transferDetails.dropoffLocation = dropoffMatch[1].trim();
        }

        // Date and Time
        const dateTimeMatch = textContent.match(/.*Date\s+(.*?)\s+Passenger\s+.*/s);
        if (dateTimeMatch) {
            parsedDetails.transferDetails.scheduledTime = dateTimeMatch[1].trim();
        }

        // Passenger Name
        const nameMatch = textContent.match(/.*Passenger\s+(.*?)\s+Phone\sNumber\s+.*/s);
        if (nameMatch) {
            parsedDetails.account.fullName = nameMatch[1].trim();
        }

        // Flight number
        const flightNumberMatch = textContent.match(/.*Flight\sNumber\s+(.*?)\s+Price\s+.*/s);
        if (flightNumberMatch) {
            parsedDetails.flightDetails.flightNumber = flightNumberMatch[1].trim();
        }

        // Phone Number
        const phoneMatch = textContent.match(/.*Phone Number\s+(.*?)\s+Passenger Count\s+.*/);
        if (phoneMatch) {
            parsedDetails.account.phoneNumber = phoneMatch[1].trim();
        }

        // Passenger Count
        const passengerCountMatch = textContent.match(/.*Passenger\sCount\s+(.*?)\s+Flight\sNumber\s+.*/);
        if (passengerCountMatch) {
            parsedDetails.account.passengerCount = parseInt(passengerCountMatch[1].trim());
        }

        // Price
        const priceMatch = textContent.match(/.*Price\s+(.*?)\s+Comments\s+.*/);
        if (priceMatch) {
            parsedDetails.transferDetails.price.amount = parseFloat(priceMatch[1].replace(',', '.'));
            parsedDetails.transferDetails.price.currency = 'EUR';
        }

        // Comments (Notes)
        const commentsMatch = textContent.match(/.*Comments\s+(.*?)\s+This\sis\san.*/);
        if (commentsMatch) {
            parsedDetails.transferDetails.notes = commentsMatch[1].trim();
        }

        return parsedDetails;
    }

    /**
     * E-posta içeriğini işle ve gerekirse transaction oluştur
     */
    private async determineEmail(mail: ParsedMail): Promise<void> {
        try {
            if (mail.from?.text === 'info@bodrumluxurytravel.com') {
                // Convert HTML to text with proper formatting
                const content = mail.html
                    ? htmlToText(mail.html, {
                          wordwrap: 130,
                          selectors: [{ selector: 'a', options: { hideLinkHrefIfSameAsText: true } }],
                      })
                    : mail.text || '';

                // Clean up extra newlines
                const textContent = content.replace(/\n\s*\n/g, '\n').trim();

                const bookingDetails = this.processBookingEmail(mail, textContent);

                // Log email content and parsed JSON model
                const logContent = `\nEmail content: ${JSON.stringify(
                    {
                        from: mail.from?.text,
                        to: mail.to?.text,
                        subject: mail.subject,
                        text: textContent,
                    },
                    null,
                    2
                )}\nJSON model: ${JSON.stringify(bookingDetails, null, 2)}\n`;

                // Write to email-content-process.log
                await fs.promises.appendFile('logs/email-content-process-7.log', logContent, 'utf8');

                if (!bookingDetails.reservationId) {
                    return;
                }

                // Check for existing transaction
                const existingTransactions = await this.transactionService.getTransactionsByExternalId(
                    bookingDetails.reservationId
                );
                const existingTransaction = existingTransactions[0];

                // Prepare transaction data
                const transactionData: CreateUpdateTransactionDTO = {
                    channelId: this.bookingChannelId,
                    externalId: bookingDetails.reservationId,
                    amount: bookingDetails.transferDetails.price.amount || 0,
                    note: JSON.stringify({
                        subject: mail.subject,
                        content: textContent,
                        bookingDetails: bookingDetails,
                    }),
                    //transactionDate: bookingDetails.transferDetails.scheduledTime || new Date(),
                    //statusId: (await this.getTransactionStatus(bookingDetails.emailType)).id,
                };

                if (existingTransaction) {
                    // Update existing transaction
                    await this.transactionService.update({
                        id: existingTransaction.id,
                        ...transactionData,
                    });
                } else {
                    // Create new transaction
                    await this.transactionService.create(transactionData);
                }
            } else {
                this.log(
                    LOG_LEVEL.INFO,
                    BOOKING_INBOX_ACTION.CONNECT,
                    'Booking mail olmadığı için atlanıyor: ',
                    mail.subject
                );
            }
        } catch (err) {
            console.error('Error processing email:', err);
        }
    }

    private async getTransactionStatus(emailType: BookingEmailType): Promise<TransactionStatus> {
        const statuses = await this.transactionService.getTransactionStatuses();
        let statusCode: string;

        // Log available statuses for debugging
        console.log(
            'Available transaction statuses:',
            statuses.map((s) => s.code)
        );

        switch (emailType) {
            case BookingEmailType.NEW:
                statusCode = 'PENDING'; // Changed from 'NEW' to 'PENDING'
                break;
            case BookingEmailType.CANCEL:
                statusCode = 'CANCELLED';
                break;
            case BookingEmailType.UPDATE:
                statusCode = 'UPDATED';
                break;
            case BookingEmailType.COMPLAINT:
                statusCode = 'COMPLAINT';
                break;
            default:
                statusCode = 'PENDING'; // Changed from 'NEW' to 'PENDING'
        }

        const status = statuses.find((s) => s.code === statusCode);
        if (!status) {
            throw new Error(
                `Transaction status not found for code: ${statusCode}. Available statuses: ${statuses.map((s) => s.code).join(', ')}`
            );
        }

        return status;
    }
}
