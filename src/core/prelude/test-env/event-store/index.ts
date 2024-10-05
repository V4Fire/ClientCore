import type { EventStoreEntry } from 'core/prelude/test-env/event-store/interface';

export * from 'core/prelude/test-env/event-store/interface';

export default class EventStore {
	events: EventStoreEntry[] = [];
	updateListeners: Set<Function> = new Set();

	push(event: EventStoreEntry): void {
		this.events.push(event);
		this.updateListeners.forEach((listener) => listener.call(this, event));
	}

	waitEvent(targetEvent: EventStoreEntry, timeout?: number): Promise<boolean> {
		const
			compareEvents = (event1: EventStoreEntry, event2: EventStoreEntry): boolean => Object.fastCompare(event1, event2);

		const
			hasEvent: boolean = this.events.some((event) => compareEvents(targetEvent, event));

		if (hasEvent || timeout === 0) {
			return Promise.resolve(hasEvent);
		}

		return new Promise<boolean>((resolve) => {
			const
				clearFns: Function[] = [];

			const resolveWith = (val: boolean) => {
				clearFns.forEach((fn) => fn.call(this));
				resolve(val);
			};

			const listener = (event: EventStoreEntry) => {
				if (compareEvents(targetEvent, event)) {
					return resolveWith(true);
				}
			};

			this.updateListeners.add(listener);
			clearFns.push(() => this.updateListeners.delete(listener));

			if (timeout != null) {
				const timerId = setTimeout(() => {
					resolveWith(false);
				}, timeout);

				clearFns.push(() => clearTimeout(timerId));
			}
		});
	}
}
