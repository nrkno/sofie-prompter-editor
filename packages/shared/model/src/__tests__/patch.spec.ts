import { diff, patch } from '../patch'

test('patch', () => {
	const a: any = {
		a: 1,
		b: 'b',
		c: null,
		d: false,
		e: true,
		f: {
			a: 1,
		},
		g: [1, { a: 1, b: 2 }],
	}

	{
		// No change
		const b0 = clone(a)
		const d = diff(a, b0)
		expect(d).toBe(undefined)
		// const b1 = patch(a, d)
		// expect(b1).toEqual(b0)
	}
	{
		const b0 = clone(a)
		b0.b = 'c'
		const d = diff(a, b0)
		if (!d) throw new Error('Expected diff to be truthy')
		const b1 = patch(a, d)
		expect(b1).toEqual(b0)
	}
	{
		const b0 = clone(a)
		delete b0.b
		const d = diff(a, b0)
		if (!d) throw new Error('Expected diff to be truthy')
		const b1 = patch(a, d)
		expect(b1).toEqual(b0)
	}
	{
		const b0 = clone(a)
		b0.g[1].a = 5
		const d = diff(a, b0)
		if (!d) throw new Error('Expected diff to be truthy')
		const b1 = patch(a, d)
		expect(b1).toEqual(b0)
	}
	{
		const b0 = clone(a)
		delete b0.g[1].b
		const d = diff(a, b0)
		if (!d) throw new Error('Expected diff to be truthy')
		const b1 = patch(a, d)
		expect(b1).toEqual(b0)
	}
	{
		const b0 = clone(a)
		b0.f = [1, 2, 3]
		const d = diff(a, b0)
		if (!d) throw new Error('Expected diff to be truthy')
		const b1 = patch(a, d)
		expect(b1).toEqual(b0)
	}
})

function clone<T>(o: T): T {
	return JSON.parse(JSON.stringify(o))
}
