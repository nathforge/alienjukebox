var async = require('async'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    path = require('path');

function Downloaded(path) {
    this.path = path;
}

Downloaded.prototype.add = function(redditLink, callback) {
    var filename;

    filename = this._getFilename(redditLink);

    async.waterfall([
        // Create the directory.
        function(callback) {
            mkdirp(path.dirname(filename), callback);
        },

        // Create the file.
        function(_, callback) {
            fs.open(filename, 'w', callback);
        },
        
        // Close the file.
        function(fd, callback) {
            fs.close(fd, callback);
        }

    ], callback);
};

Downloaded.prototype.has = function(redditLink, callback) {
    var filename;

    filename = this._getFilename(redditLink);

    async.waterfall([
        // Open the file.
        function(callback) {
            fs.open(filename, 'r', callback);
        },
        
        // Close the file.
        function(fd, callback) {
            fs.close(fd, callback);
        }

    ], function(err, result) {
        if (err) {
            if (err.code !== 'ENOENT') {
                return callback(err);
            } else {
                return callback(null, false);
            }
        } else {
            return callback(null, true);
        }
    });
};

Downloaded.prototype._getFilename = function(redditLink) {
    return this.path + '/' +
           encodeURIComponent(redditLink.data.subreddit) + '/' +
           encodeURIComponent(redditLink.data.id);
};

module.exports = Downloaded;
