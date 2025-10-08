import { Resend } from "resend";
import dotenv from "dotenv"
dotenv.config()

const resend = new Resend(process.env.RESEND_API_KEY as string); 
console.log(resend)

export default resend;
