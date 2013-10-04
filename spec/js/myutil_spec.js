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
