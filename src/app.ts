import cors from "cors";
import logger from "./log/logger";
import rateLimit from "express-rate-limit";
import { connectToDatabase } from "./config/database";
import express, { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import authRouter from "./modules/auth/auth.route";
import loanRouter from "./modules/loan/loan.route";
import walletRouter from "./modules/wallet/wallet.route";
import transactionRoutes from "./modules/transaction/transaction.routes";
//import userRouter from "./modules/user/user.route";
//import adminRouter from "./modules/admin/admin.route";
//import transactionRouter from "./modules/transaction/transaction.route";
dotenv.config();

class App {
  public express: Application;
  public port: number;

  constructor(port: number) {
    this.express = express();
    this.port = port;
    this.initializeMiddleware();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Uncomment and configure as needed
    // this.express.use(morgan("dev"));
    //this.express.use(helmet());
    const allowedOrigins = ["http://localhost:5173", ""];
    this.express.use(
      cors({
        origin: function (origin, callback) {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        credentials: true, // ✅ Must be enabled for cookies/session handling
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Requested-With",
          "Accept",
        ],
        exposedHeaders: ["Authorization"],
        optionsSuccessStatus: 204,
      }),
    );
    //this.express.options("*", cors());

    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: false }));
    this.express.use("/api/v1", authRouter, loanRouter, walletRouter, transactionRoutes);

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    });
    this.express.use(limiter);
    this.express.disable("x-powered-by");
  }

  private initializeErrorHandling(): void {
    // General error logging
    this.express.use(
      (err: any, req: Request, res: Response, next: NextFunction) => {
        logger.error(err);
        res
          .status(err.status || 500)
          .header("Access-Control-Allow-Origin", req.headers.origin || "*")
          .header("Access-Control-Allow-Credentials", "true")
          .json({
            status: false,
            message: err.message || "Something went wrong",
          });
      },
    );

    // 404 handler
    this.express.use((req, res, next) => {
      res.status(404).send({
        status: false,
        message: "Endpoint not found",
      });
    });

    // 500 handler
    this.express.use(
      (err: any, req: Request, res: Response, next: NextFunction) => {
        logger.error(err);
        res.status(500).send({
          status: false,
          message: "Something went wrong",
        });
      },
    );
  }

  public listen(): void {
    const findAvailablePort = async (startPort: number): Promise<number> => {
      let port = startPort;
      while (true) {
        try {
          await new Promise((resolve, reject) => {
            const server = this.express
              .listen(port, () => {
                server.close();
                resolve(port);
              })
              .on("error", () => {
                port++;
                reject();
              });
          });
          return port;
        } catch {
          continue;
        }
      }
    };

    findAvailablePort(3000).then((PORT) => {
      this.express.listen(PORT, async () => {
        await connectToDatabase();
        console.log(`App is listening on Port ${PORT}`);
      });
    });
  }
}

export default App;
