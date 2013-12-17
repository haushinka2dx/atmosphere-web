describe('AtmosSettings', function(){
	describe('Desktop', function(){
		var target;
		beforeEach(function() {
			localStorage.clear();
			target = AtmosSettings.Desktop;
		});

		describe('notifyPermission', function(){
			it('default value is "default"', function(){
				expect(target.notifyPermission()).toEqual('default');
			});

			it('enable set value', function(){
				target.notifyPermission('denied');
				expect(target.notifyPermission()).toEqual('denied');
			});

			cases([undefined, null, ''])
			.it('if invalid value, return default value', function(value){
				target.notifyPermission(value);
				expect(target.notifyPermission()).toEqual('default');
			});
		});

		describe('closeTimeoutSeconds', function(){
			it('default value is "10"', function(){
				expect(target.closeTimeoutSeconds()).toEqual('10');
			});

			cases([['', ''], ['-1', '-1'], ['0', '0'], ['5', '5']])
			.it('enable set value', function(value, expected){
				target.closeTimeoutSeconds(value);
				expect(target.closeTimeoutSeconds()).toEqual(expected);
			});

			cases([undefined, null])
			.it('if invalid value, return default value', function(value){
				target.closeTimeoutSeconds(value);
				expect(target.closeTimeoutSeconds()).toEqual('10');
			});
		});
	});
});
