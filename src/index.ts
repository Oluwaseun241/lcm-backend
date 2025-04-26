import App from "./app";

const app = new App(Number(process.env.PORT) || 3000);

app.listen();

export default app;
