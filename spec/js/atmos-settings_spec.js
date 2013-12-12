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
	});
});
