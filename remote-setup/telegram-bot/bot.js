const { Bot } = require("grammy");
const { exec } = require("child_process");
require("dotenv").config();

const bot = new Bot(process.env.BOT_TOKEN);
const ALLOWED_USERNAME = process.env.ALLOWED_USERNAME; // Your Telegram username

bot.command("start", (ctx) => {
  ctx.reply(`🖥 Remote Workstation Bot\nCommands:\n/build - Run xcodebuild\n/status - System status\n/screenshot - Take screenshot\n/exec <cmd> - Run shell command`);
});

bot.command("ping", (ctx) => ctx.reply("🏓 Pong! PC Build is online."));

bot.command("status", (ctx) => {
  exec("uptime && df -h / && caffeinate -t 1 || true", (err, stdout) => {
    ctx.reply(`\`\`\`\n${stdout}\n\`\`\``, { parse_mode: "MarkdownV2" });
  });
});

bot.command("build", (ctx) => {
  ctx.reply("🔨 Starting xcodebuild...");
  const proj = process.env.XCODE_PROJECT || "MyApp.xcodeproj";
  const scheme = process.env.XCODE_SCHEME || "MyApp";
  exec(
    `xcodebuild -project ${proj} -scheme ${scheme} -destination 'platform=iOS Simulator,name=iPhone 16' build`,
    { timeout: 300000 },
    (err, stdout, stderr) => {
      const output = (stdout + stderr).slice(-3800);
      ctx.reply(`\`\`\`\n${output}\n\`\`\``, { parse_mode: "MarkdownV2" });
    }
  );
});

bot.command("exec", (ctx) => {
  if (ALLOWED_USERNAME && ctx.from.username !== ALLOWED_USERNAME) {
    return ctx.reply("⛔ Unauthorized");
  }
  const cmd = ctx.message.text.replace("/exec ", "").trim();
  if (!cmd) return ctx.reply("Usage: /exec <command>");
  
  exec(cmd, { timeout: 60000 }, (err, stdout, stderr) => {
    const out = (stdout || stderr).slice(-3800);
    ctx.reply(`\`\`\`\n$ ${cmd}\n${out}\n\`\`\``, { parse_mode: "MarkdownV2" });
  });
});

bot.command("screenshot", (ctx) => {
  const path = "/tmp/remote-screenshot.png";
  exec(`screencapture -x ${path}`, (err) => {
    if (err) return ctx.reply("❌ Screenshot failed");
    ctx.replyWithPhoto(new InputFile(path));
  });
});

bot.start();
console.log("🤖 Remote bot running...");
