#!/usr/bin/env node

/**
 * Module dependencies.
 */

import * as http from "http";
import * as config from "../config";
import { logger } from "../utils/logger";

import app from "../app";

/**
 * Get port from environment and store in Express.
 */

app.set("port", config.NODE_PORT);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(config.NODE_PORT);
server.on("error", onError);

/**
 * Event listener for HTTP server "error" event.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
function onError(error: any) {
    if (error.syscall !== "listen") {
        throw error;
    }

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case "EACCES":
            logger.error(config.NODE_PORT + " requires elevated privileges");
            process.exit(1);
            break;
        case "EADDRINUSE":
            logger.error(config.NODE_PORT + " is already in use");
            process.exit(1);
            break;
        default:
            throw error;
    }
}
