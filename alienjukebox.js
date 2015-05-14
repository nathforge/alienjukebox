#!/usr/bin/env node

'use strict';

var async = require('async'),
    child_process = require('child_process'),
    Downloaded = require('./lib/downloaded'),
    request = require('superagent');

run();

function run() {
    var downloaded,
        downloadQueue,
        subreddits;

    downloaded = new Downloaded(__dirname + '/downloads/.log');

    downloadQueue = async.queue(download, 1);

    subreddits = process.argv.slice(2);

    async.each(subreddits, function(subreddit, callback) {
        request.get(subredditDataUrl(subreddit)).end(function(err, res) {
            if (err) {
                return callback(err);
            }

            if (res.statusCode !== 200) {
                return callback('Subreddit ' + subreddit + ' returned ' + res.statusCode);
            }

            JSON.parse(res.text).data.children.forEach(function(child) {
                if (child.data.is_self) {
                    return;
                }

                downloadQueue.push({
                    downloaded: downloaded,
                    redditLink: child
                });
            });
        });
    });
}

function subredditDataUrl(subreddit) {
    return 'http://reddit.com/r/' + subreddit + '.json';
}

function download(task, callback) {
    task.downloaded.has(task.redditLink, function(err, exists) {
        var process;

        if (exists) {
            return callback();
        }

        process = child_process.spawn('youtube-dl', [
            '--extract-audio',
            '--audio-format', 'mp3',
            '--output', 'downloads/' + task.redditLink.data.subreddit + '/%(title)s.%(ext)s',
            task.redditLink.data.url
        ], {
            stdio: 'inherit'
        });

        process.on('close', function(code) {
            if (code === 0) {
                task.downloaded.add(task.redditLink, callback);
            } else {
                return callback('youtube-dl exited with code ' + code);
            }
        });
    });
}
