/*!
 * V4Fire Client Core
 * https://github.com/V4Fire/Client
 *
 * Released under the MIT license
 * https://github.com/V4Fire/Client/blob/master/LICENSE
 */

'use strict';

const sharp = require('sharp');

/**
 * Implementation of the 'Adapter' interface
 * @see https://github.com/dazuaz/responsive-loader/tree/master#writing-your-own-adapter
 */
class Adapter {
	constructor(imagePath) {
		this.image = sharp(imagePath);
	}

	/**
	 * Returns metadata of the image
	 *
	 * @returns {sharp.Metadata}
	 * @see https://github.com/dazuaz/responsive-loader/tree/master#writing-your-own-adapter
	 */
	metadata() {
		return this.image.metadata();
	}

	/**
	 * Scales the image to the provided amount of its original size and converts to the specified formats
	 *
	 * @param {{width: number, mime: string, options: object}} data - information and the image and provided options
	 * @returns Promise<{data: Buffer, width: number, height: number}>
	 * @see https://github.com/dazuaz/responsive-loader/tree/master#writing-your-own-adapter
	 */
	resize({mime, width: scaleBy, options: {quality, sizes}}) {
		return new Promise(async (resolve, reject) => {
			const
				imageClone = this.image.clone(),
				{width, height} = await imageClone.metadata();

			if (width == null || height == null) {
				reject('Unable to receive width and height of the image', this.image);
				return;
			}

			const
				scaledImage = this.#scale(imageClone, width, height, scaleBy, sizes.length),
				convertedImage = this.#convert(scaledImage, mime, quality);

			convertedImage.toBuffer((err, data, {width, height}) => {
				if (err) {
					reject(err);

				} else {
					resolve({data, width, height});
				}
			});
		});
	}

	/**
	 * Scales the image by the provided amount of its original size
	 *
	 * @param {sharp.Sharp} image
	 * @param {number} width
	 * @param {number} height
	 * @param {number} scaleBy
	 * @param {number} maxScaleSize
	 * @returns {sharp.Sharp}
	 */
	#scale(image, width, height, scaleBy, maxScaleSize) {
		if (scaleBy === maxScaleSize) {
			return image;
		}

		const
			stepWidth = Math.floor(width / maxScaleSize),
			stepHeight = Math.floor(height / maxScaleSize);

		return image.resize(
			stepWidth * scaleBy,
			stepHeight * scaleBy
		);
	}

	/**
	 * Converts the original image to another format
	 *
	 * @param {sharp.Sharp} image
	 * @param {string} mimeType
	 * @param {number} quality
	 * @returns {sharp.Sharp}
	 */
	#convert(image, mimeType, quality) {
		const formatMethods = {
			'image/png': image.png,
			'image/jpeg': image.jpeg,
			'image/jpg': image.jpeg,
			'image/webp': image.webp,
			'image/avif': image.avif
		};

		return formatMethods[mimeType]?.call(image, {quality});
	}
}

/**
 * Adapter for scaling an image by the provided amount of its original size
 *
 * @param {string} imagePath
 * @returns {Adapter}
 */
module.exports = (imagePath) => new Adapter(imagePath);
