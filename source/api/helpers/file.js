'use strict';

const anxeb = require('anxeb-node');
const Imaging = require('../../middleware/imaging');

module.exports = function (context, file) {
	return {
		archive : async function (params) {
			let file = params.file;
			let filePath = params.path;
			let fileName = params.fileName;

			if (file && filePath && fileName) {
				let absolutePath = context.service.locate.storage(filePath);

				if (!anxeb.utils.file.exists(absolutePath)) {
					anxeb.utils.fs.mkdirSync(absolutePath, { recursive : true });
				}

				let fullPath = anxeb.utils.path.join(absolutePath, fileName)
				await file.mv(fullPath);
			}
		},
		process : async function (options) {
			let filePath, fileRelativePath;

			filePath = anxeb.utils.path.join(`${file.owner.type.toLowerCase()}s`);
			fileRelativePath = anxeb.utils.path.join(filePath, file._id.toString() + file.extension);

			if (!filePath) {
				context.log.exception.file_not_found.args(file.name).throw(context);
			}

			let fileAbsolutePath = context.service.locate.storage(fileRelativePath);

			if (!anxeb.utils.file.exists(fileAbsolutePath)) {
				context.log.exception.file_not_found.args(file.name).throw(context);
			}

			let attachmentName = encodeURIComponent(file.name);
			if (options.output === 'download') {
				context.file(fileAbsolutePath, {
					headers : {
						'Content-Type'        : file.mime,
						'Content-Disposition' : 'attachment;filename=' + attachmentName + '; filename*=UTF-8\'\'' + attachmentName
					}
				});
			} else if (options.output === 'open') {
				context.file(fileAbsolutePath, {
					headers : {
						'Content-Type'        : file.mime,
						'Content-Disposition' : 'inline;filename=' + attachmentName + '; filename*=UTF-8\'\'' + attachmentName
					}
				});
			} else if (options.output === 'preview') {
				await Imaging.processFileRequest(context, fileAbsolutePath, {
					isPath    : true,
					extension : file.extension
				});
			} else {
				context.log.exception.invalid_request.throw(context);
			}
		}
	}
};