import moment from "moment";
import { styleText, type InspectColor } from "util";

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
type LogDomain = 'Main' | 'HttpServer' | 'P2P' | 'Wallet'

const levelToColor = (level: LogLevel): InspectColor => {
  var color: InspectColor = "white"
  switch(level) {
    case 'DEBUG': color = "green"; break;
    case 'INFO': color = "blue"; break;
    case 'WARN': color = "yellow"; break;
    case 'ERROR': color = "red"; break;
  }
  return color
}

class Logger {
  private log(level: LogLevel, domain: LogDomain, ...data: any[]) {
    const logOutput = `[${moment().format("YYYY-MM-DD HH:mm:ss")} ${styleText(levelToColor(level), level.padEnd(5, " "))} ${domain.padEnd(10, " ")}]  ${data.map((v) => v.toString()).join(" ")}`
    switch (level) {
      case 'DEBUG': console.debug(logOutput); break;
      case 'INFO': console.info(logOutput); break;
      case 'WARN': console.warn(logOutput); break;
      case 'ERROR': console.error(logOutput); break;
    }
  }

  debug(domain: LogDomain, ...data: any[]) { this.log('DEBUG', domain, ...data); }
  info(domain: LogDomain, ...data: any[]) { this.log('INFO', domain, ...data); }
  warn(domain: LogDomain, ...data: any[]) { this.log('WARN', domain, ...data); }
  error(domain: LogDomain, ...data: any[]) { this.log('ERROR', domain, ...data); }
}

export const logger = new Logger();