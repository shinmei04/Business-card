import { Hono } from "hono";
import { renderer } from "./renderer";
import { fullMetalBackgroundStyle } from "./styles/fullMetalBackgroundStyle";
import { Card } from "./components/Card";

const app = new Hono();

app.get("*", renderer);

app.get("/", (c) => {
  return c.redirect("/card");
});

app.get("/card", (c) => {
  return c.render(
    <main class={fullMetalBackgroundStyle}>
      <Card />
    </main>,
    { title: "名刺 | Kosei Niimi" }
  );
});

export default app;
