import { Injectable, OnModuleInit } from '@nestjs/common';
import * as IMAP from 'node-imap';
import { simpleParser } from 'mailparser';
import { EntityManager } from 'typeorm';
import { LogService } from '../log/log.service';
import { LOG_LEVEL, LogLevel, PERSON_TYPE } from '../../constants';
import { TransactionService } from '../transaction/transaction.service';
import { CreateUpdateTransactionDTO } from '../transaction/dto/create-update-transaction.dto';
import { ParsedMail } from 'mailparser';
import { htmlToText } from 'html-to-text';
import * as fs from 'fs';
import { AccountService } from '../account/account.service';
import { GetAccountsDTO } from '../account/dto/get-accounts.dto';
import { CreateUpdateAccountDTO } from '../account/dto/create-update-account.dto';

enum BookingEmailType {
    NEW = 'NEW',
    CANCEL = 'CANCEL',
    UPDATE = 'UPDATE',
    COMPLAINT = 'COMPLAINT',
}

type BookingDetails = {
    reservationId: string;
    emailType: BookingEmailType;
    traveler: {
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
    flightNumber: string;
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
};

// Email servis log action sabitleri
export enum INBOX_ACTION {
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
    private bookingTransactionTypeId: string;
    private bookingStatusId: string;

    constructor(
        private readonly entityManager: EntityManager,
        private readonly logService: LogService,
        private readonly transactionService: TransactionService,
        private readonly accountService: AccountService
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
            this.log(LOG_LEVEL.ERROR, INBOX_ACTION.CONNECT, 'IMAP bağlantı hatası', err);
        });
    }

    /**
     * Log kaydı oluştur
     */
    private async log(
        level: LogLevel,
        action: INBOX_ACTION,
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
        await this.log(LOG_LEVEL.INFO, INBOX_ACTION.CHECK, 'Uygulama başladı, ilk e-posta kontrolü yapılıyor...');
        console.log('Uygulama başladı, ilk e-posta kontrolü yapılıyor...');

        // Get booking channel
        const channels = await this.transactionService.getChannelsLookup();
        const bookingChannel = channels.find((channel) => channel.code === 'BOOKING');
        if (!bookingChannel) {
            throw new Error('Booking channel not found');
        }
        this.bookingChannelId = bookingChannel.id.toString();

        // Get booking rezervation type
        const transactionTypes = await this.transactionService.getTransactionTypesLookup();
        const bookingTransactionType = transactionTypes.find((transactionType) => transactionType.code === 'R');
        if (!bookingTransactionType) {
            throw new Error('Booking transaction type not found');
        }
        this.bookingTransactionTypeId = bookingTransactionType.id.toString();

        // Get booking status
        const transactionStatuses = await this.transactionService.getTransactionStatuses();
        const bookingTransactionStatus = transactionStatuses.find(
            (transactionStatus) => transactionStatus.code === 'N'
        );
        if (!bookingTransactionStatus) {
            throw new Error('Booking transaction status not found');
        }
        this.bookingStatusId = bookingTransactionStatus.id.toString();

        // Uygulama başladığında gelen kutusunu kontrol et
        try {
            await this.fetchEmails();
            console.log('Başlangıç e-posta kontrolü başarıyla tamamlandı');
        } catch (error) {
            console.error('Başlangıç e-posta kontrolü sırasında hata oluştu', error);
            await this.log(
                LOG_LEVEL.ERROR,
                INBOX_ACTION.CHECK,
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
            INBOX_ACTION.CHECK,
            `E-postalar kontrol ediliyor (${this.emailCheckInterval} dakikada bir)...`
        );

        try {
            await this.fetchEmails();
        } catch (error) {
            await this.log(
                LOG_LEVEL.ERROR,
                INBOX_ACTION.CHECK,
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
        await this.log(LOG_LEVEL.INFO, INBOX_ACTION.CHECK_MANUAL, 'E-postalar manuel olarak kontrol ediliyor...');

        try {
            await this.fetchEmails();
            return { success: true, message: 'E-postalar başarıyla kontrol edildi.' };
        } catch (error) {
            await this.log(
                LOG_LEVEL.ERROR,
                INBOX_ACTION.CHECK_MANUAL,
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
                            this.log(LOG_LEVEL.INFO, INBOX_ACTION.FETCH, 'İşlenecek yeni e-posta yok.');
                            this.imap.end();
                            resolve();
                            return;
                        }

                        this.log(LOG_LEVEL.INFO, INBOX_ACTION.FETCH, `${results.length} adet yeni e-posta bulundu.`, {
                            count: results.length,
                        });

                        const fetch = this.imap.fetch(results, { bodies: '', markSeen: false });
                        let processedCount = 0;

                        fetch.on('message', (msg) => {
                            msg.on('body', (stream) => {
                                // E-posta içeriğini ayrıştır
                                simpleParser(stream, async (err, mail) => {
                                    if (err) {
                                        this.log(
                                            LOG_LEVEL.ERROR,
                                            INBOX_ACTION.PARSE,
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
                                            INBOX_ACTION.PROCESS,
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
                            this.log(LOG_LEVEL.ERROR, INBOX_ACTION.FETCH, 'E-posta getirme hatası', err, err.stack);
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
            traveler: {
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
            flightNumber: '',
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
            parsedDetails.traveler.fullName = nameMatch[1].trim();
        }

        // Flight number
        const flightNumberMatch = textContent.match(/.*Flight\sNumber\s+(.*?)\s+Price\s+.*/s);
        if (flightNumberMatch) {
            parsedDetails.flightNumber = flightNumberMatch[1].trim();
        }

        // Phone Number
        const phoneMatch = textContent.match(/.*Phone Number\s+(.*?)\s+Passenger Count\s+.*/);
        if (phoneMatch) {
            parsedDetails.traveler.phoneNumber = phoneMatch[1].trim();
        }

        // Passenger Count
        const passengerCountMatch = textContent.match(/.*Passenger\sCount\s+(.*?)\s+Flight\sNumber\s+.*/);
        if (passengerCountMatch) {
            parsedDetails.traveler.passengerCount = parseInt(passengerCountMatch[1].trim());
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
            if (mail.from?.text.includes('info@bodrumluxurytravel.com')) {
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
                const logContent = JSON.stringify(
                    {
                        email: {
                            from: mail.from?.text,
                            to: mail.to?.text,
                            subject: mail.subject,
                            text: textContent,
                        },
                        jsonModel: bookingDetails,
                    },
                    null,
                    2
                );

                // Write to email-content-process.log
                await fs.promises.appendFile('logs/email-content-process-01.log', logContent, 'utf8');

                if (!bookingDetails.reservationId) {
                    return;
                }

                // Find or create account based on transfer company email
                let accountId: string | undefined;

                if (bookingDetails.transferCompany?.email) {
                    // Search for existing account with this email
                    const filters: GetAccountsDTO = {
                        text: bookingDetails.transferCompany.email,
                        pageSize: 1,
                    };

                    const accountsResult = await this.accountService.getAccountsByFilters(filters);

                    if (accountsResult.items.length > 0) {
                        // Use existing account
                        accountId = accountsResult.items[0].id;
                    } else {
                        // Create new account
                        const newAccountData: CreateUpdateAccountDTO = {
                            name: bookingDetails.transferCompany.name || bookingDetails.transferCompany.email,
                            email: bookingDetails.transferCompany.email,
                            personType: PERSON_TYPE.CORPORATE,
                        };

                        const newAccount = await this.accountService.create(newAccountData);
                        accountId = newAccount.id;
                    }
                }

                // Check for existing transaction
                const existingTransactions = await this.transactionService.getTransactionsByExternalId(
                    bookingDetails.reservationId
                );
                const existingTransaction = existingTransactions[0];

                // Prepare transaction data
                const transactionData: CreateUpdateTransactionDTO = {
                    no: bookingDetails.reservationId,
                    typeId: this.bookingTransactionTypeId,
                    statusId: existingTransaction ? existingTransaction.status?.id : this.bookingStatusId,
                    channelId: this.bookingChannelId,
                    externalId: bookingDetails.reservationId,
                    amount: bookingDetails.transferDetails.price.amount || 0,
                    note: logContent,
                    accountId: accountId,
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
                this.log(LOG_LEVEL.INFO, INBOX_ACTION.CONNECT, 'Booking maili olmadığı için atlanıyor: ', mail.subject);
            }
        } catch (err) {
            console.error('Error processing email:', err);
        }
    }
}
