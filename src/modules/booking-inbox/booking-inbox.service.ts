import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import * as IMAP from 'node-imap';
import { simpleParser } from 'mailparser';
import { EntityManager } from 'typeorm';
import { LogService } from '../log/log.service';
import { LOG_LEVEL, LogLevel, PERSON_TYPE } from '../../types/constants';
import { TransactionService } from '../transaction/transaction.service';
import { CreateUpdateTransactionDTO } from '../transaction/dto/create-update-transaction.dto';
import { ParsedMail } from 'mailparser';
import { htmlToText } from 'html-to-text';
import * as fs from 'fs';
import { AccountService } from '../account/account.service';
import { GetAccountsDTO } from '../account/dto/get-accounts.dto';
import { CreateUpdateAccountDTO } from '../account/dto/create-update-account.dto';
import { ProductService } from '../product/product.service';
import { SettingService } from '../setting/setting.service';

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
        vehicleType: string;
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
export class BookingInboxService implements OnApplicationBootstrap, OnApplicationShutdown {
    private imap: IMAP;
    private inboxCheckInterval: number;
    private inboxCheckPeriod: number;
    private bookingChannelId: string;
    private bookingTransactionTypeId: string;
    private bookingNewStatusId: string;
    private bookingCancelStatusId: string;
    private scheduledTimeout: NodeJS.Timeout;

    constructor(
        private readonly entityManager: EntityManager,
        private readonly logService: LogService,
        private readonly transactionService: TransactionService,
        private readonly accountService: AccountService,
        private readonly productService: ProductService,
        private readonly settingService: SettingService
    ) {}

    async onApplicationBootstrap() {
        // Initialize settings and IMAP connection in the background
        this.initializeInBackground();
    }

    private async initializeInBackground() {
        try {
            const [inboxCheckInterval, inboxCheckPeriod, inboxUser, inboxPassword, inboxHost, inboxPort, inboxTls] =
                await this.settingService.getSettings([
                    'bl_inbox_check_interval',
                    'bl_inbox_check_period',
                    'bl_inbox_user',
                    'bl_inbox_password',
                    'bl_inbox_host',
                    'bl_inbox_port',
                    'bl_inbox_tls',
                ]);

            this.inboxCheckInterval = parseInt(inboxCheckInterval || '60', 10);
            this.inboxCheckPeriod = parseInt(inboxCheckPeriod || '600', 10);

            this.imap = new IMAP({
                user: inboxUser,
                password: inboxPassword,
                host: inboxHost,
                port: parseInt(inboxPort || '993', 10),
                tls: inboxTls === 'true',
                tlsOptions: { rejectUnauthorized: false },
                authTimeout: 10000,
            });

            // Hata olaylarını dinle
            this.imap.once('error', (err) => {
                this.log(LOG_LEVEL.ERROR, INBOX_ACTION.CONNECT, 'IMAP bağlantı hatası', err);
            });

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

            const bookingTransactionNewStatus = transactionStatuses.find(
                (transactionStatus) => transactionStatus.code === 'N'
            );
            if (!bookingTransactionNewStatus) {
                throw new Error('Booking transaction status not found');
            }
            this.bookingNewStatusId = bookingTransactionNewStatus.id.toString();

            // Get booking status
            const bookingTransactionCancelStatus = transactionStatuses.find(
                (transactionStatus) => transactionStatus.code === 'A'
            );
            if (!bookingTransactionCancelStatus) {
                throw new Error('Booking transaction status not found');
            }
            this.bookingCancelStatusId = bookingTransactionCancelStatus.id.toString();

            await this.startServerUp();

            // İlk kontrolü planla
            this.scheduleNextCheck();

            console.log(`E-posta kontrolü ${this.inboxCheckInterval} saniyede bir çalışacak şekilde planlandı`);
        } catch (error) {
            console.error('IMAP initialization error:', error);
            await this.log(LOG_LEVEL.ERROR, INBOX_ACTION.CONNECT, 'IMAP initialization error', error, error.stack);
        }
    }

    async startServerUp() {
        // Uygulama başladığında gelen kutusunu kontrol et
        try {
            await this.fetchEmails();
            console.log('Server up e-posta kontrolü başarıyla tamamlandı');
        } catch (error) {
            console.error('Server up e-posta kontrolü sırasında hata oluştu', error);
            await this.log(
                LOG_LEVEL.ERROR,
                INBOX_ACTION.CHECK,
                'Server up e-posta kontrolü sırasında hata oluştu',
                error,
                error.stack
            );
        }
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
        console.log(level, action, message, details, stackTrace);
        await this.logService.log({
            level,
            module: 'BookingInboxService',
            action,
            message,
            details,
            stackTrace,
            entityType: 'BOOKING_INBOX',
        });
    }

    async startScheduled() {
        await this.log(
            LOG_LEVEL.INFO,
            INBOX_ACTION.CHECK,
            `E-postalar kontrol ediliyor (${this.inboxCheckInterval} saniyede bir)...`
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
                    // Saniye cinsinden period'u milisaniyeye çevirip çıkarıyoruz
                    startDate.setTime(startDate.getTime() - this.inboxCheckPeriod * 1000);

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
                        let fetchedEmailCount = 0;

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
                                        fetchedEmailCount++;
                                        if (fetchedEmailCount === results.length) {
                                            this.imap.end();
                                            resolve();
                                        }
                                        return;
                                    }
                                    if (mail.from?.text.includes('info@bodrumluxurytravel.com')) {
                                        try {
                                            // E-posta içeriğini kontrol et ve gerekirse transaction oluştur
                                            await this.processBookingEmail(mail);
                                        } catch (e) {
                                            this.log(
                                                LOG_LEVEL.ERROR,
                                                INBOX_ACTION.PROCESS,
                                                'E-posta işlenirken hata',
                                                e,
                                                e.stack
                                            );
                                        }
                                    } else {
                                        this.log(
                                            LOG_LEVEL.INFO,
                                            INBOX_ACTION.CONNECT,
                                            'Booking maili olmadığı için atlanıyor: ',
                                            mail.subject
                                        );
                                    }

                                    fetchedEmailCount++;
                                    if (fetchedEmailCount === results.length) {
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
    private determineEmailType(mail: ParsedMail, textContent: string): BookingDetails {
        const details: BookingDetails = {
            reservationId: '',
            emailType: BookingEmailType.NEW,
            traveler: {
                fullName: '',
                phoneNumber: '',
                passengerCount: 0,
            },
            transferDetails: {
                vehicleType: '',
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
        const vehicleTypeMatch = textContent.match(/.*Vehicle Type\s+(.*?)\s+From\s+.*/s);
        if (vehicleTypeMatch) {
            parsedDetails.transferDetails.vehicleType = vehicleTypeMatch[1].trim() as any;
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
    private async processBookingEmail(mail: ParsedMail): Promise<void> {
        try {
            // Convert HTML to text with proper formatting
            const content = mail.html
                ? htmlToText(mail.html, {
                      wordwrap: 130,
                      selectors: [{ selector: 'a', options: { hideLinkHrefIfSameAsText: true } }],
                  })
                : mail.text || '';

            // Clean up extra newlines
            const textContent = content.replace(/\n\s*\n/g, '\n').trim();

            const bookingDetails = this.determineEmailType(mail, textContent);

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
                statusId: existingTransaction ? existingTransaction.status?.id : this.bookingNewStatusId,
                channelId: this.bookingChannelId,
                externalId: bookingDetails.reservationId,
                amount: bookingDetails.transferDetails.price.amount || 0,
                note: logContent,
                accountId: accountId,
            };

            if (existingTransaction) {
                if (bookingDetails.emailType === BookingEmailType.CANCEL) {
                    transactionData.statusId = this.bookingCancelStatusId;
                }
                // Update existing transaction
                await this.transactionService.update({
                    id: existingTransaction.id,
                    ...transactionData,
                });
            } else {
                // Check if product exists by code
                const productResult = await this.productService.getProductsByFilters({
                    code: bookingDetails.transferDetails.vehicleType,
                });

                let productId: string;
                if (productResult.items.length === 0) {
                    // Create new product if it doesn't exist
                    const newProduct = await this.productService.create({
                        name: bookingDetails.transferDetails.vehicleType,
                        code: bookingDetails.transferDetails.vehicleType,
                        sequence: 1,
                        isActive: true,
                    });
                    productId = newProduct.id;
                } else {
                    productId = productResult.items[0].id;
                }

                transactionData.products = [
                    {
                        productId,
                        quantity: bookingDetails.traveler.passengerCount,
                        unitPrice: 0,
                        totalPrice: transactionData.amount,
                    },
                ];

                transactionData.locations = [
                    {
                        code: 'FROM',
                        address: bookingDetails.transferDetails.pickupLocation,
                    },
                    {
                        code: 'TO',
                        address: bookingDetails.transferDetails.dropoffLocation,
                    },
                ];

                // Create new transaction
                await this.transactionService.create(transactionData);
            }
        } catch (error) {
            console.error('Error in determineEmail:', error);
            throw error;
        }
    }

    // Yeni metot: Bir sonraki kontrolü planla
    private scheduleNextCheck() {
        // Önceki zamanlayıcıyı temizle
        if (this.scheduledTimeout) {
            clearTimeout(this.scheduledTimeout);
        }

        // Yeni bir zamanlayıcı ayarla
        this.scheduledTimeout = setTimeout(async () => {
            try {
                // İşlemi gerçekleştir
                await this.startScheduled();
            } catch (error) {
                console.error('E-posta kontrolü sırasında hata oluştu:', error);
                await this.log(
                    LOG_LEVEL.ERROR,
                    INBOX_ACTION.CHECK,
                    'E-posta kontrolü sırasında hata oluştu',
                    error,
                    error.stack
                );
            } finally {
                // İşlem tamamlandıktan sonra bir sonraki kontrolü planla
                this.scheduleNextCheck();
            }
        }, this.inboxCheckInterval * 1000);
    }

    async onApplicationShutdown() {
        // Clear the timeout when the application shuts down
        if (this.scheduledTimeout) {
            clearTimeout(this.scheduledTimeout);
            console.log('E-posta kontrol zamanlayıcısı temizlendi');
        }
    }
}
