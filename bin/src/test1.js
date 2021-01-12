"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var path_1 = __importDefault(require("path"));
var database_1 = require("./lib/common/database");
var MonitorProcess_1 = require("./tools/yield_farming/auto_balancer/MonitorProcess");
var database_2 = require("./tools/yield_farming/database");
// require("./src/tools/yield_farming/auto_balancer/MonitorProcess")
var MonitorProcessPath = path_1.default.resolve(__dirname + "/src/tools/yield_farming/auto_balancer/MonitorProcess");
console.log("s");
