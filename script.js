import http from "http";
import fs from "fs/promises";
import crypto from "crypto";
import path from "path";
const filepath = path.join("data", "links.json");
const loadlinks = async () => {
  try {
    const DATA = await fs.readFile(filepath, "utf-8");
    return JSON.parse(DATA);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile(filepath, JSON.stringify({}));
      return {};
    }
  }
};
async function savelinks(links) {
  await fs.writeFile(filepath, JSON.stringify(links));
}
const redfile = async (name, res, type) => {
  try {
    const data = await fs.readFile(name, "utf-8");
    res.writeHead(200, { "content-type": `text/${type}` });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { "content-type": `text/${type}` });
    res.end("404 error page not found");
  }
};
const server = http.createServer(async (req, res) => {
  if (req.method === "GET") {
    if (req.url === "/") {
      return redfile("index.html", res, "html");
    } else if (req.url === "/style.css") {
      return redfile("style.css", res, "css");
    } else if (req.url == "/links") {
      const links = await loadlinks();
      res.writeHead(200, { "Content-type": "application/json" });
      return res.end(JSON.stringify(links));
    } else {
      const links = await loadlinks();
      const shortCode = req.url.slice(1);
      if (links[shortCode]) {
        res.writeHead(302, { location: links[shortCode] });
        return res.end();
      }
      res.writeHead(404, { "content-type": "text/plain" });
      return res.end("shortend URL not found");
    }
  }
  if (req.method === "POST" && req.url === "/shorten") {
    const links = await loadlinks();
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      console.log(body);
      const { url, shortCode } = JSON.parse(body);
      if (!url) {
        res.writeHead(400, { "Content-type": "text/plain" });
        return res.end("url is required");
      }
      const finalshort = shortCode || crypto.randomBytes(4).toString("hex");
      if (links[finalshort]) {
        res.writeHead(400, { "Content-type": "text/plain" });
        return res.end("shortend url already exits");
      }
      links[finalshort] = url;
      await savelinks(links);
      res.writeHead(200, { "Content-type": "text/plain" });
      return res.end();
    });
    return;
  }
  res.writeHead(404, { "content-type": `text/plain` });
  res.end("404 error page not found");
});

const port = 3000;
server.listen(port, () => {
  console.log(`listening to port ${port}`);
});
