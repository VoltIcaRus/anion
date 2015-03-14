const API_URL = 'http://www.anissia.net/anitime';
const USER_AGENT = 'Ani-ON Crawler (http://zn.oa.to/anion/) - TestVersion';

var request = require('request-promise').defaults({
	method: 'POST',
	json: true,
	encoding: 'UTF-8',
	headers: {
		'User-Agent': USER_AGENT
	}
});

var Anissia = {};

function processEpisode(ep) {
	if (ep.match(/\d{5}/)) {
		var result = '';
		var int = Number(ep.substr(0,4));
		if (int == 9999) {
			return '완료';
		}
		var f = Number(ep.slice(-1));
		result += int;
		if (f > 0) {
			result += '.' + f;
		}
		return result;
	} else {
		return ep;
	}
}

Anissia.getAnilist = function getAnilist(weekday) {
	if (typeof weekday != 'number' || weekday < 0 || weekday > 8) {
		throw 'illegal weekday: '+weekday;
	}
	console.info('getAnilist(%s)', weekday);
	return request({
		uri: API_URL+'/list',
		qs: {w: weekday}
	}).then(function(resp) {
		if (resp.forEach) {
			resp.forEach(function(ani, ind) {
				ani.index = ind;
				ani.weekday = weekday;
				ani.id = ani.i;
				ani.title = ani.s;
				ani.time = ani.t;
				ani.ended = false;
				ani.genre = ani.g.replace(/ /g,'').split('/');
				ani.homepage = 'http://'.concat(ani.l.trim());
				ani.broaded = ani.a;
				ani.startdate = ani.sd;
				ani.enddate = ani.ed;
				'i s t g l a sd ed'.split(' ').forEach(function(k) {
					delete ani[k];
				});
			});
			return resp;
		} else {
			throw 'bad response';
		}
	});
	;
};

Anissia.getAni = function getAni(id) {
	return request({
		uri: API_URL+'/cap',
		qs: {i: id}
	}).then(function(resp) {
		if (resp.forEach) {
			resp.forEach(function(ani) {
				var url;
				ani.episode = processEpisode(ani.s);
				ani.updateat = ani.d;
				url = ani.a.trim();
				if (!ani.a.length || ani.a.indexOf('www.test.com') != -1) {
					ani.url = null;
				} else {
					ani.url = 'http://'.concat(ani.a.trim());
				}
				ani.name = ani.n;
				's d a n'.split(' ').forEach(function(k) {
					delete ani[k];
				});
			});
			return resp;
		} else {
			throw 'bad response';
		}
	});
};

Anissia.getEndedAnilist = function getEndedAnilist(page) {
	return request({
		url: API_URL+'/end',
		qs: {p: page}
	}).then(function(resp){
		if (resp.forEach) {
			resp.forEach(function(ani, ind) {
				ani.index = (page * 50) + ind;
				ani.id = ani.i;
				ani.title = ani.s.trim();
				ani.ended = true;
				ani.genres = ani.g.replace(/ /g,'').split(/\/|／/);
				ani.homepage = ani.l.trim();
				ani.startdate = ani.sd;
				ani.enddate = ani.ed;
				'i s t g l sd ed'.split(' ').forEach(function(k) {
					delete ani[k];
				});
			});
			return resp;
		} else {
			throw 'bad response';
		}
	});
};

module.exports = Anissia;
