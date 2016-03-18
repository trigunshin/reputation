import os, json
from bson import json_util, ObjectId
from datetime import datetime
from flask import Flask, jsonify, request
from pymongo import MongoClient

from cross_domain import crossdomain

app = Flask(__name__)

app.config.from_object('settings')
mongo = MongoClient(app.config['MONGO_URI'])
db = mongo.get_default_database()

@app.route('/userData/<userScriptId>/<website>/<articleId>/<username>/<userId>/<commentId>/add')
@crossdomain(origin='*')
def addComment(userScriptId, website, articleId, username, userId, commentId):
    query_args = {
        'userScriptId': userScriptId,
        'site': website,
        'articleId': articleId,
        'siteUserId': userId,
        'siteUsername': username,
        'commentId': commentId,
        'createdOn': datetime.utcnow(),
        'userCommentText': request.args.get('comment', None)
    }
    db.comments.insert_one(query_args)
    return 'Comment saved.'

@app.route('/userData/<userScriptId>/<website>/<articleId>/<username>/<userId>/<commentId>/remove', methods=["POST"])
@crossdomain(origin='*')
def deleteComment(userScriptId, website, articleId, username, userId, commentId):
    query_args = {
        '_id': commentId
    }
    result = db.comments.delete_many(query_args)
    return 'deleted %i comments' % result.deleted_count

@app.route('/userComments/<userScriptId>/<website>/<userId>/get')
@crossdomain(origin='*')
def getUserComments(userScriptId, website, userId):
    query_args = {
        'userScriptId': userScriptId,
        'site': website,
        'siteUsername': userId
    }
    # run query, make it into a {data: []} form, then jsonify & return
    raw_data = [a for a in db.comments.find(query_args)]
    json_result = json.loads(json_util.dumps(raw_data))
    return "%s(%s)" % (request.args.get('callback'), json.dumps(json_result))

@app.route('/userComments/<userScriptId>/<website>/get')
@crossdomain(origin='*')
def getPageComments(userScriptId, website):
    idList = request.args.getlist('userId')
    query_args = {
        'userScriptId': userScriptId,
        'site': website,
        'siteUserId': {
            '$in': idList
        }
    }
    # run query, make it into a {data: []} form, then jsonify & return
    raw_data = {'data': [a for a in db.comments.find(query_args)]}
    json_result = json.loads(json_util.dumps(raw_data))
    return jsonify(json_result)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.debug = True
    app.run(host='0.0.0.0', port=port)
