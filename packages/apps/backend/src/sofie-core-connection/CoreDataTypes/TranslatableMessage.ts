import { ITranslatableMessage as IBlueprintTranslatableMessage } from '@sofie-automation/blueprints-integration'

/**
 * @enum - A translatable message (i18next)
 */
export interface ITranslatableMessage extends IBlueprintTranslatableMessage {
	/** namespace used */
	namespaces?: Array<string>
}
