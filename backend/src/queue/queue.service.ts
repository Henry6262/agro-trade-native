import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job } from 'bullmq';
import { createClient, RedisClientType } from 'redis';

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: any;
}

export interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

export interface OrderMatchingJobData {
  sellOrderId: string;
  buyOrderId: string;
}

export interface PaymentProcessingJobData {
  dealId: string;
  paymentIntentId: string;
}

@Injectable()
export class QueueService implements OnModuleInit {
  private readonly logger = new Logger(QueueService.name);
  private connection: RedisClientType;
  
  // Queue instances
  private emailQueue: Queue;
  private notificationQueue: Queue;
  private orderMatchingQueue: Queue;
  private paymentQueue: Queue;
  
  // Workers
  private emailWorker: Worker;
  private notificationWorker: Worker;
  private orderMatchingWorker: Worker;
  private paymentWorker: Worker;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('QUEUE_REDIS_URL') || 
                     this.configService.get<string>('REDIS_URL');
    
    // Create Redis connection for BullMQ
    this.connection = createClient({
      url: redisUrl,
    });

    this.connection.on('error', (err) => {
      this.logger.error('Queue Redis Connection Error:', err);
    });
  }

  async onModuleInit() {
    await this.connection.connect();
    this.initializeQueues();
    this.initializeWorkers();
  }

  private initializeQueues() {
    const defaultJobOptions = {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    };

    // Initialize queues
    this.emailQueue = new Queue('email', {
      connection: this.connection,
      defaultJobOptions,
    });

    this.notificationQueue = new Queue('notification', {
      connection: this.connection,
      defaultJobOptions,
    });

    this.orderMatchingQueue = new Queue('order-matching', {
      connection: this.connection,
      defaultJobOptions: {
        ...defaultJobOptions,
        delay: 1000, // Small delay to batch potential matches
      },
    });

    this.paymentQueue = new Queue('payment', {
      connection: this.connection,
      defaultJobOptions: {
        ...defaultJobOptions,
        attempts: 5,
      },
    });

    this.logger.log('All queues initialized successfully');
  }

  private initializeWorkers() {
    const concurrency = this.configService.get<number>('QUEUE_CONCURRENCY', 10);

    // Email Worker
    this.emailWorker = new Worker('email', this.processEmailJob.bind(this), {
      connection: this.connection,
      concurrency: Math.ceil(concurrency / 2),
    });

    // Notification Worker
    this.notificationWorker = new Worker('notification', this.processNotificationJob.bind(this), {
      connection: this.connection,
      concurrency,
    });

    // Order Matching Worker
    this.orderMatchingWorker = new Worker('order-matching', this.processOrderMatchingJob.bind(this), {
      connection: this.connection,
      concurrency: Math.ceil(concurrency / 4),
    });

    // Payment Worker
    this.paymentWorker = new Worker('payment', this.processPaymentJob.bind(this), {
      connection: this.connection,
      concurrency: Math.ceil(concurrency / 2),
    });

    this.setupWorkerEventListeners();
    this.logger.log('All workers initialized successfully');
  }

  private setupWorkerEventListeners() {
    const workers = [
      { worker: this.emailWorker, name: 'Email' },
      { worker: this.notificationWorker, name: 'Notification' },
      { worker: this.orderMatchingWorker, name: 'OrderMatching' },
      { worker: this.paymentWorker, name: 'Payment' },
    ];

    workers.forEach(({ worker, name }) => {
      worker.on('completed', (job) => {
        this.logger.log(`${name} job ${job.id} completed`);
      });

      worker.on('failed', (job, err) => {
        this.logger.error(`${name} job ${job?.id} failed:`, err);
      });

      worker.on('stalled', (jobId) => {
        this.logger.warn(`${name} job ${jobId} stalled`);
      });
    });
  }

  // Job Processing Methods
  private async processEmailJob(job: Job<EmailJobData>) {
    const { to, subject, template, data } = job.data;
    
    try {
      // Here you would integrate with your email service (NodeMailer, SendGrid, etc.)
      this.logger.log(`Sending email to ${to} with subject: ${subject}`);
      
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  private async processNotificationJob(job: Job<NotificationJobData>) {
    const { userId, type, title, message, data } = job.data;
    
    try {
      // Here you would integrate with push notification service (FCM, etc.)
      this.logger.log(`Sending notification to user ${userId}: ${title}`);
      
      // You would also save to database and send via WebSocket
      // await this.notificationService.create({ userId, type, title, message, data });
      // await this.websocketService.sendToUser(userId, { type, title, message, data });
      
      this.logger.log(`Notification sent successfully to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}:`, error);
      throw error;
    }
  }

  private async processOrderMatchingJob(job: Job<OrderMatchingJobData>) {
    const { sellOrderId, buyOrderId } = job.data;
    
    try {
      this.logger.log(`Processing order match: ${sellOrderId} <-> ${buyOrderId}`);
      
      // Here you would implement the order matching logic
      // This might involve creating a deal, calculating commission, etc.
      
      this.logger.log(`Order matching completed for ${sellOrderId} <-> ${buyOrderId}`);
    } catch (error) {
      this.logger.error(`Failed to process order matching:`, error);
      throw error;
    }
  }

  private async processPaymentJob(job: Job<PaymentProcessingJobData>) {
    const { dealId, paymentIntentId } = job.data;
    
    try {
      this.logger.log(`Processing payment for deal ${dealId}`);
      
      // Here you would integrate with Stripe or other payment processor
      // await this.paymentService.processPayment(dealId, paymentIntentId);
      
      this.logger.log(`Payment processed successfully for deal ${dealId}`);
    } catch (error) {
      this.logger.error(`Failed to process payment for deal ${dealId}:`, error);
      throw error;
    }
  }

  // Public methods to add jobs to queues
  async sendEmail(emailData: EmailJobData, options?: any) {
    try {
      const job = await this.emailQueue.add('send-email', emailData, options);
      this.logger.log(`Email job ${job.id} added to queue`);
      return job;
    } catch (error) {
      this.logger.error('Failed to add email job to queue:', error);
      throw error;
    }
  }

  async sendNotification(notificationData: NotificationJobData, options?: any) {
    try {
      const job = await this.notificationQueue.add('send-notification', notificationData, options);
      this.logger.log(`Notification job ${job.id} added to queue`);
      return job;
    } catch (error) {
      this.logger.error('Failed to add notification job to queue:', error);
      throw error;
    }
  }

  async processOrderMatching(orderMatchingData: OrderMatchingJobData, options?: any) {
    try {
      const job = await this.orderMatchingQueue.add('match-orders', orderMatchingData, options);
      this.logger.log(`Order matching job ${job.id} added to queue`);
      return job;
    } catch (error) {
      this.logger.error('Failed to add order matching job to queue:', error);
      throw error;
    }
  }

  async processPayment(paymentData: PaymentProcessingJobData, options?: any) {
    try {
      const job = await this.paymentQueue.add('process-payment', paymentData, options);
      this.logger.log(`Payment job ${job.id} added to queue`);
      return job;
    } catch (error) {
      this.logger.error('Failed to add payment job to queue:', error);
      throw error;
    }
  }

  // Utility methods
  async getQueueStats() {
    const stats = {
      email: await this.emailQueue.getJobs(['waiting', 'active', 'completed', 'failed']),
      notification: await this.notificationQueue.getJobs(['waiting', 'active', 'completed', 'failed']),
      orderMatching: await this.orderMatchingQueue.getJobs(['waiting', 'active', 'completed', 'failed']),
      payment: await this.paymentQueue.getJobs(['waiting', 'active', 'completed', 'failed']),
    };

    return Object.entries(stats).reduce((acc, [queue, jobs]) => {
      acc[queue] = {
        waiting: jobs.filter(job => job.opts.delay && Date.now() < job.timestamp + job.opts.delay).length,
        active: jobs.filter(job => job.processedOn && !job.finishedOn).length,
        completed: jobs.filter(job => job.finishedOn && !job.failedReason).length,
        failed: jobs.filter(job => job.failedReason).length,
      };
      return acc;
    }, {});
  }

  async pauseQueue(queueName: string) {
    const queue = this.getQueue(queueName);
    if (queue) {
      await queue.pause();
      this.logger.log(`Queue ${queueName} paused`);
    }
  }

  async resumeQueue(queueName: string) {
    const queue = this.getQueue(queueName);
    if (queue) {
      await queue.resume();
      this.logger.log(`Queue ${queueName} resumed`);
    }
  }

  private getQueue(queueName: string): Queue | null {
    switch (queueName) {
      case 'email':
        return this.emailQueue;
      case 'notification':
        return this.notificationQueue;
      case 'order-matching':
        return this.orderMatchingQueue;
      case 'payment':
        return this.paymentQueue;
      default:
        return null;
    }
  }
}