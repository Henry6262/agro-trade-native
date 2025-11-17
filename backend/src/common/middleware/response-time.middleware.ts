import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class ResponseTimeMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;

    // Set header BEFORE response finishes
    const originalSend = res.send;
    res.send = function (data) {
      const duration = Date.now() - start;
      res.setHeader("X-Response-Time", `${duration}ms`);
      return originalSend.call(this, data);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      // Log slow requests (> 500ms)
      if (duration > 500) {
        this.logger.warn(
          `SLOW ${method} ${originalUrl} ${statusCode} - ${duration}ms`,
        );
      } else if (duration > 200) {
        // Log moderately slow requests
        this.logger.log(
          `${method} ${originalUrl} ${statusCode} - ${duration}ms`,
        );
      } else {
        // Fast requests - only debug level
        this.logger.debug(
          `${method} ${originalUrl} ${statusCode} - ${duration}ms`,
        );
      }
    });

    next();
  }
}
