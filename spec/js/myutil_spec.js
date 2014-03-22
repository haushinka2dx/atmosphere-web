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

describe('extractAddressesUsers', function(){
       cases([
                 ['', []],
                 ['aaa3329', []],
                 ['@edwards', ['edwards']],
                 ['hello @edwards', ['edwards']],
                 ['@john are you online?', ['john']],
                 ['I will take a lunch with @jack, @joe, and @bob.', ['jack','joe','bob']],
       ])
       .it('userId is extracted out of string', function(msg, expected) {
               expect(extractAddressesUsers(msg)).toEqual(expected);
       });
});

describe('extractAddressesGroups', function(){
       cases([
                 ['', []],
                 ['aaa3329', []],
                 ['$libro', ['libro']],
                 ['hello $libro team.', ['libro']],
                 ['$infra it is a day to finish.', ['infra']],
                 ['There are $teama, $teamb, and $teamc.', ['teama','teamb','teamc']],
       ])
       .it('groupId is extracted out of string', function(msg, expected) {
               expect(extractAddressesGroups(msg)).toEqual(expected);
       });
});

describe('extractHashtags', function(){
       cases([
                 ['', []],
                 ['aaa3329', []],
                 ['#lgtm', ['lgtm']],
                 ['this is problem #at', ['at']],
                 ['#fyi apache 2.2 is faster than apache 2.4.', ['fyi']],
                 ['This is first version. #app #version #release', ['app','version','release']],
       ])
       .it('hashtags is extracted out of string', function(msg, expected) {
               expect(extractHashtags(msg)).toEqual(expected);
       });
});

describe('extractEKeywords', function(){
       cases([
                 ['', []],
                 ['@test', []],
                 ['$test', []],
                 ['#test', []],
                 ['aaa3329', ['aaa3329']],
                 ['this is problem #at $test by @jj', ['this','is', 'problem', 'by']],
       ])
       .it('keywords is extracted out of string', function(msg, expected) {
               expect(extractKeywords(msg)).toEqual(expected);
       });
});
