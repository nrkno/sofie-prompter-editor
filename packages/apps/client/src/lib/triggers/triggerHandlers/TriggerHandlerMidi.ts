import { assertNever } from '@sofie-prompter-editor/shared-lib'
import { TriggerHandler } from './TriggerHandler'
import { TriggerConfig, TriggerConfigMidi, TriggerConfigType } from '../triggerConfig'
import { AnyTriggerAction } from '../../triggerActions/triggerActions'

export class TriggerHandlerMidi extends TriggerHandler<TriggerConfigMidi> {
	protected neededAnyDevice = false
	private neededDevices = new Set<{
		name: string
	}>()

	private connectedMidiListeners: MIDIInput[] = []

	async initialize(triggers?: TriggerConfig[]): Promise<void> {
		if (triggers) this.triggers = triggers
		// Make list of which panels we have triggers for:
		for (const trigger of this.triggers) {
			if (trigger.type !== TriggerConfigType.MIDI) continue

			if (!trigger.name) {
				this.neededAnyDevice = true
			} else {
				trigger.name = trigger.name.toLowerCase() // for non-case-sensitive comparison
				this.neededDevices.add({ name: trigger.name })
			}
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const theWindow = window as any

		// hot-module-reload fix:
		if (!theWindow.midiInitialized) {
			theWindow.midiInitialized = true
			theWindow.midiListeners = []
		}
		const setupMidiInputs = theWindow.midiListeners as MIDIInput[]

		for (const entry of setupMidiInputs) {
			entry.onmidimessage = null
		}
		setupMidiInputs.splice(0, setupMidiInputs.length)

		navigator
			.requestMIDIAccess()
			.then((midiAccess) => {
				midiAccess.inputs.forEach((midiInput) => {
					console.log('MIDI input', midiInput)

					const midiInfo: MIDIInputInfo = {
						fullName: `${midiInput.manufacturer} ${midiInput.name}`.toLowerCase(),
					}

					let isNeeded = this.neededAnyDevice
					if (!isNeeded) {
						for (const needed of this.neededDevices.values()) {
							if (midiInfo.fullName.includes(needed.name)) {
								isNeeded = true
								break
							}
						}
					}

					this.neededDevices

					setupMidiInputs.push(midiInput)
					this.connectedMidiListeners.push(midiInput)

					midiInput.onmidimessage = (event) => {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						this.onMidiMessage(midiInfo, (event as any).data)
					}
				})
			})
			.catch((e) => console.error('MIDI error', e))

		this.triggerKeys = []
		this.triggerAnalog = []

		for (const trigger of this.triggers) {
			if (trigger.type !== TriggerConfigType.MIDI) continue

			if (trigger.eventType === 'down' || trigger.eventType === 'up') {
				this.triggerKeys.push(trigger)
			} else if (trigger.eventType === 'analog') {
				this.triggerAnalog.push(trigger)
			} else {
				assertNever(trigger.eventType)
			}
		}
	}

	async destroy(): Promise<void> {
		for (const entry of this.connectedMidiListeners) {
			entry.onmidimessage = null
		}
	}

	private onMidiMessage(midiInfo: MIDIInputInfo, data: number[]) {
		if (data.length === 3) {
			const leadingBit = data[0] >> 7
			if (leadingBit === 1) {
				const fcn = (data[0] >> 4) & 7 // Use only the first nibble, and discard the leading bit

				if (fcn === 0) {
					// Note off
					const channel = data[0] & 15 // Second nibble
					const keyNumber = data[1]
					// const velocity = data[2]

					this.onKeyUp(midiInfo, channel, keyNumber)
				} else if (fcn === 1) {
					// Note on
					const channel = data[0] & 15 // Second nibble
					const keyNumber = data[1]
					// const velocity = data[2]

					this.onKeyDown(midiInfo, channel, keyNumber)
				} else if (fcn === 2) {
					// Polyphonic Key Pressure / AfterTouch
					// Not supported
				} else if (fcn === 3) {
					// Control change
					const channel = data[0] & 15 // Second nibble
					const controllerNumber = data[1]
					const value = data[2]

					this.onAnalog(midiInfo, channel, controllerNumber, value)
				} else if (fcn === 4) {
					// Program Change
					// Not supported
				} else if (fcn === 5) {
					// Channel Pressure / AfterTouch
					// Not supported
				} else if (fcn === 6) {
					// Pitch Bend
					// Not supported
				} else {
					// Not supported
				}
			}
		}
	}
	private onKeyDown(midiInfo: MIDIInputInfo, channel: number, index: number) {
		this.doKeyAction(midiInfo, 'up', channel, index)
	}
	private onKeyUp(midiInfo: MIDIInputInfo, channel: number, index: number) {
		this.doKeyAction(midiInfo, 'up', channel, index)
	}

	private onAnalog(midiInfo: MIDIInputInfo, channel: number, index: number, value: number) {
		this.doAnalogAction(midiInfo, channel, index, value, -64, 64) // [0, 127]
	}

	/** Generate an action from a key input */
	private doKeyAction(
		midiInfo: MIDIInputInfo,
		eventType: TriggerConfigMidi['eventType'],
		channel: number,
		keyIndex: number
	): void {
		const action = this.getKeyAction(
			(t) =>
				(t.name === null || midiInfo.fullName.includes(t.name)) &&
				t.eventType === eventType &&
				(t.channel === null || t.channel === channel) &&
				(t.index === null || t.index === keyIndex)
		)
		if (action) this.emit('action', action)
		else console.log('MIDI', eventType, midiInfo.fullName, channel)
	}
	/** Generate an action from a "analog type" input */
	private doAnalogAction(
		midiInfo: MIDIInputInfo,
		channel: number,
		index: number,
		value: number,
		scaleMaxValue = 1,
		zeroValue = 0
	): void {
		const action = this.getAnalogAction(
			(t) =>
				(t.name === null || midiInfo.fullName.includes(t.name)) &&
				t.eventType === 'analog' &&
				(t.channel === null || t.channel === channel) &&
				(t.index === null || t.index === index),
			value,
			{
				scaleMaxValue,
				zeroValue,
			}
		)
		console.log(this.triggerAnalog)
		if (action) this.emit('action', action)
		else console.log('MIDI', 'analog', midiInfo.fullName, channel, index)
	}
}
interface MIDIInputInfo {
	fullName: string
}
