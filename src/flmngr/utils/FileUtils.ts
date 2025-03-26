import { FileItem, FileType } from '../models/FileTypes'
import { v4 as uuidv4 } from 'uuid'

/**
 * Утилиты для работы с файлами
 */
export class FileUtils {
	/**
	 * Форматирует размер файла в читаемый вид
	 * @param bytes размер в байтах
	 * @returns отформатированный размер
	 */
	public static formatSize(bytes: number): string {
		if (bytes === 0) return '0 B'

		const k = 1024
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))

		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	/**
	 * Форматирует дату в читаемый вид
	 * @param date дата для форматирования
	 * @returns отформатированная дата
	 */
	public static formatDate(date: Date): string {
		return date.toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		})
	}

	/**
	 * Определяет тип файла по расширению
	 * @param filename имя файла
	 * @returns тип файла
	 */
	public static getFileType(filename: string): FileType {
		const extension = filename.split('.').pop()?.toLowerCase() || ''

		const typeMap: Record<string, FileType> = {
			// Изображения
			jpg: 'image',
			jpeg: 'image',
			png: 'image',
			gif: 'image',
			svg: 'image',
			webp: 'image',
			bmp: 'image',

			// Документы
			pdf: 'document',
			doc: 'document',
			docx: 'document',
			xls: 'document',
			xlsx: 'document',
			ppt: 'document',
			pptx: 'document',
			txt: 'document',
			rtf: 'document',
			odt: 'document',

			// Видео
			mp4: 'video',
			avi: 'video',
			mov: 'video',
			wmv: 'video',
			mkv: 'video',
			webm: 'video',

			// Аудио
			mp3: 'audio',
			wav: 'audio',
			ogg: 'audio',
			flac: 'audio',
			aac: 'audio',

			// Архивы
			zip: 'archive',
			rar: 'archive',
			tar: 'archive',
			gz: 'archive',
			'7z': 'archive',

			// Код
			js: 'code',
			ts: 'code',
			html: 'code',
			css: 'code',
			php: 'code',
			py: 'code',
			java: 'code',
			c: 'code',
			cpp: 'code',
			cs: 'code',
			json: 'code',
		}

		return typeMap[extension] || 'other'
	}

	/**
	 * Генерирует уникальный идентификатор
	 * @returns уникальный идентификатор
	 */
	public static generateUniqueId(): string {
		return Math.random().toString(36).substring(2) + Date.now().toString(36)
	}
}

/**
 * Форматирует размер файла в читаемый вид
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Байт'

	const k = 1024
	const sizes = ['Байт', 'КБ', 'МБ', 'ГБ', 'ТБ']
	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Генерирует уникальный ID
 */
export function generateUniqueId(): string {
	return uuidv4()
}

/**
 * Создает объект FileItem
 */
export function createFileItem(
	name: string,
	path: string,
	size: number,
	isDirectory: boolean
): FileItem {
	return {
		id: generateUniqueId(),
		name,
		path,
		size,
		modifiedAt: new Date(),
		isDirectory,
		type: isDirectory ? 'folder' : FileUtils.getFileType(name),
	}
}

/**
 * Получает иконку файла в зависимости от его типа
 */
export function getFileIcon(fileType: FileType): string {
	switch (fileType) {
		case 'folder':
			return '📁'
		case 'image':
			return '🖼️'
		case 'video':
			return '🎬'
		case 'audio':
			return '🎵'
		case 'document':
			return '📄'
		case 'archive':
			return '🗄️'
		case 'code':
			return '📝'
		case 'other':
		case 'file':
		default:
			return '📄'
	}
}
