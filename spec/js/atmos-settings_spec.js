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

	describe('Timeline', function(){
		var target;
		beforeEach(function() {
			localStorage.clear();
			target = AtmosSettings.Timeline;
		});

		describe('timelineDefinitions', function(){
			it('default value', function(){
				expect(JSON.stringify(target.timelineDefinitions())).toEqual(JSON.stringify(target.defaultTimelineDefinitions));
			});

			cases([{tl1:{name:"1",class:"aaa"},tl2:{name:"2",class:"bbb"}}])
			.it('set valid value', function(value){
				target.timelineDefinitions(value);
				expect(JSON.stringify(target.timelineDefinitions())).toEqual(JSON.stringify(value));
			});

			cases([undefined, null, ''])
			.it('if invalid value, return default value', function(value){
				target.timelineDefinitions(value);
				expect(JSON.stringify(target.timelineDefinitions())).toEqual(JSON.stringify(target.defaultTimelineDefinitions));
			});
		});

		describe('timelineOrder', function(){
			it('default value', function(){
				expect(JSON.stringify(target.timelineOrder())).toEqual(JSON.stringify(target.defaultTimelineOrder));
			});

			cases([{tl1:2,tl2:1}])
			.it('set valid value', function(value){
				target.timelineOrder(value);
				expect(target.timelineOrder()).toEqual(value);
			});

			cases([undefined, null, ''])
			.it('if invalid value, return default value', function(value){
				target.timelineOrder(value);
				expect(JSON.stringify(target.timelineOrder())).toEqual(JSON.stringify(target.defaultTimelineOrder));
			});
		});
	});
});
