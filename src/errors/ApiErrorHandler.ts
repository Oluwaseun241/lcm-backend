import { Response } from "express";

function apiErrorHandler(code: number, message: string, res: Response) {
  try {
    return res
      .status(code)
      .header("Access-Control-Allow-Origin", "*")
      .header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH",
      )
      .header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, Accept",
      )
      .header("Access-Control-Allow-Credentials", "true")
      .json({
        status: false,
        message: message,
      });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .header("Access-Control-Allow-Origin", "*")
      .header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH",
      )
      .header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, Accept",
      )
      .header("Access-Control-Allow-Credentials", "true")
      .send({
        status: false,
        message: "Something went wrong",
      });
  }
}
export default apiErrorHandler;
