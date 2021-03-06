define('battle/session', function() {
	
	function Session(options) {
		var socket = io.connect('/battle'),
			bus = options.bus,
			me = options.user,
			subs = [],
			challenge = {
				id: options.challengeId,
				users: []
			};

		function sub(topic, fn) {
			subs.push(bus.sub(topic, fn));
		}

		// Global error handler
		socket.on('bugger-off', function(data) {
			alert('UR BACKEND ERRORD: ' + data.message);
			window.location = window.location.origin;
		});

		socket.on('starting-something', function(data) {
			challenge.users.push(data.user);
			bus.pub('new-user', data);
		});

		sub('kick-off', function() {
			socket.emit('kick-off');
		});

		sub('attack', function(data) {
			socket.emit('attack', data);
		});

		sub('winning', function(data) {
			socket.emit('winning', data);
		});

		socket.on('attacked', function(data) {
			bus.pub('attacked', data);
		});

		socket.on('its-kicking-off', function(data) {
			challenge.name = data.challengeName;
			bus.pub('its-kicking-off',{
				challenge: challenge,
				user: me
			});
		});

		socket.on('user-fucked-off', function(data) {
			// Remove from local challenge
			var users = challenge.users,
				userIndex;

			users.forEach(function(u, index) {
				if (data.user.id === u.id) {
					userIndex = index;
					return false;
				}
			});

			if (userIndex >= 0)
				users.splice(userIndex, 1);

			// Tell any subscribers
			bus.pub('user-fucked-off', data);
		});

		socket.once('bring-it', function(data) {
			([]).push.apply(challenge.users, data.users);
			challenge.leader = data.leader;
			challenge.name = data.challengeName;

			bus.pub(data.state === 'waiting' ? 'waiting' : 'its-kicking-off', {
				challenge: challenge,
				user: me
			});
		});

		socket.emit('talking-shit', {
			challengeId: challenge.id,
			user: me
		});

		socket.on('game-over', function(data) {
			bus.pub('game-over', data);
		});
	}

	return Session;
});
