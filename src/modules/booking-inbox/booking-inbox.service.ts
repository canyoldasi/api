import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
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
import * as moment from 'moment';

enum BookingEmailType {
    NEW = 'NEW',
    CANCEL = 'CANCEL',
    UPDATE = 'UPDATE',
    COMPLAINT = 'COMPLAINT',
}

type BookingDetails = {
    messageId: string;
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
    FETCH = 'FETCH',
    PARSE = 'PARSE',
    PROCESS = 'PROCESS',
    SKIP = 'SKIP',
}

@Injectable()
export class BookingInboxService implements OnApplicationBootstrap, OnApplicationShutdown {
    private client: ImapFlow;
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
            const [
                inboxCheckActive,
                inboxCheckInterval,
                inboxCheckPeriod,
                inboxUser,
                inboxPassword,
                inboxHost,
                inboxPort,
                inboxTls,
            ] = await this.settingService.getSettings([
                'bl_inbox_check_active',
                'bl_inbox_check_interval',
                'bl_inbox_check_period',
                'bl_inbox_user',
                'bl_inbox_password',
                'bl_inbox_host',
                'bl_inbox_port',
                'bl_inbox_tls',
            ]);

            if (inboxCheckActive != 'true') {
                return;
            }

            this.inboxCheckInterval = parseInt(inboxCheckInterval || '60', 10);
            this.inboxCheckPeriod = parseInt(inboxCheckPeriod || '600', 10);

            this.client = new ImapFlow({
                host: inboxHost,
                port: parseInt(inboxPort || '993', 10),
                secure: inboxTls === 'true',
                auth: {
                    user: inboxUser,
                    pass: inboxPassword,
                },
                logger: false,
            });

            // Hata olaylarını dinle
            this.client.on('error', (err) => {
                this.log(LOG_LEVEL.ERROR, INBOX_ACTION.CONNECT, 'IMAP bağlantı hatası', err, null, null);
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
            this.bookingTransactionTypeId = bookingTransactionType?.id?.toString() || null;

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

            this.log(
                LOG_LEVEL.INFO,
                INBOX_ACTION.CONNECT,
                `E-posta kontrolü ${this.inboxCheckInterval} saniyede bir çalışacak şekilde planlandı`,
                null,
                null,
                null
            );
        } catch (error) {
            await this.log(
                LOG_LEVEL.ERROR,
                INBOX_ACTION.CONNECT,
                'IMAP initialization error',
                error,
                null,
                error.stack
            );
        }
    }

    async startServerUp() {
        // Uygulama başladığında gelen kutusunu kontrol et
        try {
            await this.fetchEmails();
            this.log(LOG_LEVEL.INFO, INBOX_ACTION.CHECK, 'startServerUp başarıyla tamamlandı', null, null, null);
        } catch (error) {
            await this.log(
                LOG_LEVEL.ERROR,
                INBOX_ACTION.CHECK,
                'startServerUp sırasında hata oluştu',
                error,
                null,
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
        details: any,
        entityId: string,
        stackTrace: string
    ): Promise<void> {
        await this.logService.log({
            level,
            module: 'BookingInboxService',
            action,
            message,
            details,
            stackTrace,
            entityType: 'BOOKING_INBOX',
            entity: entityId,
        });
    }

    async startScheduled() {
        await this.log(
            LOG_LEVEL.INFO,
            INBOX_ACTION.CHECK,
            `startScheduled başladı (${this.inboxCheckInterval} saniyede bir...`,
            null,
            null,
            null
        );

        try {
            await this.fetchEmails();
            this.log(LOG_LEVEL.INFO, INBOX_ACTION.CHECK, 'startScheduled başarıyla tamamlandı', null, null, null);
        } catch (error) {
            await this.log(
                LOG_LEVEL.ERROR,
                INBOX_ACTION.CHECK,
                'startScheduled sırasında hata oluştu',
                error,
                null,
                error.stack
            );
        }
    }

    /**
     * Manuel olarak e-postaları kontrol et
     */
    async startManuel() {
        this.log(LOG_LEVEL.INFO, INBOX_ACTION.CHECK, 'startManuel başarıyla tamamlandı', null, null, null);
        try {
            await this.fetchEmails();
            return { success: true, message: 'E-postalar başarıyla kontrol edildi.' };
        } catch (error) {
            await this.log(
                LOG_LEVEL.ERROR,
                INBOX_ACTION.CHECK,
                'startManuel sırasında hata oluştu',
                error,
                null,
                error.stack
            );
            return { success: false, message: error.message };
        }
    }

    /**
     * E-postaları getir ve işle
     */
    private async fetchEmails(): Promise<void> {
        try {
            await this.client.connect();
            await this.client.mailboxOpen('INBOX');

            // Get current time minus check period
            const startDate = moment().subtract(this.inboxCheckPeriod, 'seconds');

            // Get all messages
            const messages = await this.client.search(
                {
                    since: startDate.toISOString(),
                },
                { uid: true }
            );

            if (messages.length === 0) {
                this.log(LOG_LEVEL.INFO, INBOX_ACTION.CHECK, 'İşlenecek e-posta bulunamadı', null, null, null);
                return;
            }

            this.log(LOG_LEVEL.INFO, INBOX_ACTION.CHECK, `${messages.length} adet e-posta bulundu`, null, null, null);

            // Process emails sequentially
            for (const uid of messages) {
                try {
                    // Download full content
                    const { content } = await this.client.download(uid.toString());
                    if (!content) {
                        this.log(
                            LOG_LEVEL.ERROR,
                            INBOX_ACTION.FETCH,
                            'E-posta içeriği bulunamadı',
                            null,
                            uid.toString(),
                            null
                        );
                        continue;
                    }
                    try {
                        const mail = await simpleParser(content);
                        try {
                            const mailDate = moment(mail.date);
                            const isInRange = mailDate.isAfter(startDate);

                            console.log(
                                'Mail date:',
                                mailDate.format('YYYY-MM-DD HH:mm:ss'),
                                'Start date:',
                                startDate.format('YYYY-MM-DD HH:mm:ss'),
                                'Is in range:',
                                isInRange
                            );

                            if (isInRange) {
                                const cleanMessageId = mail.messageId?.replace(/[<>]/g, '');

                                const existingLogs = await this.logService.getLogs({
                                    level: LOG_LEVEL.INFO,
                                    action: INBOX_ACTION.FETCH,
                                    entity: cleanMessageId,
                                });

                                if (existingLogs?.length == 0) {
                                    this.log(
                                        LOG_LEVEL.INFO,
                                        INBOX_ACTION.FETCH,
                                        `E-posta işleniyor, mail date: ${mailDate.format('YYYY-MM-DD HH:mm:ss')}`,
                                        null,
                                        cleanMessageId,
                                        null
                                    );

                                    if (mail.from?.text.includes('info@bodrumluxurytravel.com')) {
                                        try {
                                            await this.processBookingEmail(mail, cleanMessageId);
                                        } catch (e) {
                                            this.log(
                                                LOG_LEVEL.ERROR,
                                                INBOX_ACTION.PROCESS,
                                                'E-posta işlenirken hata',
                                                e,
                                                cleanMessageId,
                                                e.stack
                                            );
                                        }
                                    } else {
                                        this.log(
                                            LOG_LEVEL.INFO,
                                            INBOX_ACTION.SKIP,
                                            'Booking maili olmadığı için atlanıyor',
                                            mail.subject,
                                            cleanMessageId,
                                            null
                                        );
                                    }
                                } else {
                                    this.log(
                                        LOG_LEVEL.INFO,
                                        INBOX_ACTION.SKIP,
                                        'E-posta zaten işlendiği için atlanıyor',
                                        null,
                                        cleanMessageId,
                                        null
                                    );
                                }
                            }
                        } catch (error) {
                            this.log(
                                LOG_LEVEL.ERROR,
                                INBOX_ACTION.PROCESS,
                                'simpleParser error',
                                error,
                                null,
                                error.stack
                            );
                        }
                    } catch (error) {
                        this.log(
                            LOG_LEVEL.ERROR,
                            INBOX_ACTION.FETCH,
                            'client.download error',
                            error,
                            null,
                            error.stack
                        );
                    }
                } catch (error) {
                    this.log(LOG_LEVEL.ERROR, INBOX_ACTION.FETCH, 'E-posta çekme hatası', error, null, error.stack);
                }
            }
        } catch (error) {
            this.log(LOG_LEVEL.ERROR, INBOX_ACTION.CHECK, 'E-posta kontrolü sırasında hata', error, null, error.stack);
            throw error;
        } finally {
            await this.client.logout();
        }
    }

    private determineEmailType(mail: ParsedMail, textContent: string): BookingDetails {
        const details: BookingDetails = {
            messageId: '',
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
    private async processBookingEmail(mail: ParsedMail, messageId: string): Promise<void> {
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

            bookingDetails.messageId = messageId;

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

                const accountsResult = await this.accountService.getAccounts(filters);

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

            console.log('-------------------------------');
            console.log('ReservationId', bookingDetails.reservationId);
            console.log('Var mı', existingTransactions.length > 0 ? 'Var' : 'Yok');

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
                name: bookingDetails.traveler.fullName,
                phone: bookingDetails.traveler.phoneNumber,
            };

            if (existingTransactions.length > 0) {
                if (bookingDetails.emailType === BookingEmailType.CANCEL) {
                    transactionData.statusId = this.bookingCancelStatusId;
                }
                // Update existing transaction
                await this.transactionService.update({
                    id: existingTransaction.id,
                    ...transactionData,
                });
                console.log('Güncellendi: ', bookingDetails.reservationId);
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
                console.log('Eklendi: ', bookingDetails.reservationId);
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
                    null,
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
        }
    }
}
