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

	it('if not undefined, not null, and has length more than 0, or function object return true', function(){
		expect(canl(' ')).toBe(true);
		expect(canl(['a','e'])).toBe(true);
		expect(canl(function() { return 1; })).toBe(true);
	});
});

describe('getAttachmentClassName', function() {
	cases([
		  ['apk',  'flaticon-apk2'],
		  ['css',  'flaticon-css6'],
		  ['csv',  'flaticon-csv'],
		  ['dat',  'flaticon-dat'],
		  ['dll',  'flaticon-dll3'],
		  ['dmg',  'flaticon-dmg2'],
		  ['doc',  'flaticon-doc'],
		  ['docx', 'flaticon-docx1'],
		  ['exe',  'flaticon-exe2'],
		  ['gz',   'flaticon-gzip1'],
		  ['html', 'flaticon-html8'],
		  ['jar',  'flaticon-jar10'],
		  ['js',   'flaticon-js3'],
		  ['log',  'flaticon-log1'],
		  ['pdf',  'flaticon-pdf17'],
		  ['psd',  'flaticon-photoshop'],
		  ['ppt',  'flaticon-ppt2'],
		  ['pptx', 'flaticon-pptx'],
		  ['sql',  'flaticon-sql'],
		  ['txt',  'flaticon-txt'],
		  ['xls',  'flaticon-xls2'],
		  ['xlsx', 'flaticon-xlsx1'],
		  ['xml',  'flaticon-xml6'],
		  ['zip',  'flaticon-zip5'],
	])
	.it('supported file types', function(filetype, expected) {
		expect(getAttachmentClassName(filetype)).toEqual(expected);
	});
});

describe('getAttachmentClassName', function() {
	cases(['', 'eps', null, undefined])
	.it('unsupported file types', function(filetype) {
		expect(getAttachmentClassName(filetype)).toEqual('flaticon-bin5');
	});
});

describe('getExtension', function(){
	cases([
		  ['', ''],
		  ['atxt', ''],
		  ['.properties', 'properties'],
		  ['aaa.jpg', 'jpg'],
		  ['iii.aaa.png', 'png'],
	])
	.it('getExtension', function(filename, expected) {
		expect(getExtension(filename)).toEqual(expected);
	});
});
