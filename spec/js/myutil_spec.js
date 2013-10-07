describe('can', function(){
	it('if undefined or null, return false', function(){
		expect(can(undefined)).toBe(false);
		expect(can(null)).toBe(false);
	});

	it('if not undefined or null, return true', function(){
		expect(can(0)).toBe(true);
		expect(can([])).toBe(true);
		expect(can('')).toBe(true);
	});
});

describe('canl', function(){
	it('if undefined, null, or has no length return false', function(){
		expect(canl(undefined)).toBe(false);
		expect(canl(null)).toBe(false);
		expect(canl(1)).toBe(false);
		expect(canl('')).toBe(false);
		expect(canl([])).toBe(false);
		expect(canl({})).toBe(false);
	});

	it('if not undefined, not null, and has length more than 0 return true', function(){
		expect(canl(' ')).toBe(true);
		expect(canl(['a','e'])).toBe(true);
	});
});
