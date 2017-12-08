'use strict';

const fs = require("fs");

// TODO globalに書き込むのをやめた方がよい
global.factory_data = null;
global.pokemon_data = null;
global.pokemon_name2id = null;
global.trainer_names = null;
global.waza_data = null;
global.waza_fromname = null;
global.silver_nejiki_id;
global.gold_nejiki_id;
global.initialize_factory = initialize_factory;
global.entries_collision = entries_collision;
global.is_shiny_pid = is_shiny_pid;

var natures = "がんばりや さみしがり ゆうかん いじっぱり やんちゃ ずぶとい すなお のんき わんぱく のうてんき おくびょう せっかち まじめ ようき むじゃき ひかえめ おっとり れいせい てれや うっかりや おだやか おとなしい なまいき しんちょう きまぐれ".split(" ");

function initialize_factory(callback) {	
	var factory_data_text;
	var pokedex_csv_text;
	var trainer_names_text;
	var waza_csv_text;
	fs.readFile("factory_data.txt", (err, data) => {
		if (err) throw err;
		factory_data_text = data.toString("utf-8");
		boot();
	});
	fs.readFile("pokedex.csv", (err, data) => {
		if (err) throw err;
		pokedex_csv_text = data.toString("utf-8");
		boot();
	});
	fs.readFile("trainer.txt", (err, data) => {
		if (err) throw err;
		trainer_names_text = data.toString("utf-8");
		boot();
	});
	fs.readFile("waza.csv", (err, data) => {
		if (err) throw err;
		waza_csv_text = data.toString("utf-8");
		boot();
	});
	function boot() {
		if (!factory_data_text || !pokedex_csv_text || !trainer_names_text || !waza_csv_text) return;
		initialize_pokemon_data(pokedex_csv_text);
		initialize_factory_entries(factory_data_text);
		initialize_trainer_names(trainer_names_text);
		initialize_waza(waza_csv_text);
		callback();
	}
}

function initialize_pokemon_data(pokedex_csv_text) {
	var lines = pokedex_csv_text.split("\n");
	if (lines[lines.length - 1] === "") lines.pop();
	var boundaries = {"♂のみ": -1, "♀のみ": 255, "1:7": 30, "1:3": 63, "1:1": 126, "3:1": 190, "ふめい": null};
	pokemon_data = new Array(lines.length);
	pokemon_name2id = {};
	for (var i = 0; i < lines.length; i ++) {
		var row = lines[i].split(",");
		var name = row[0];
		var stats = row.slice(1, 1 + 6).map(Number);
		var ability1 = row[7];
		var ability2 = row[8] || ability1;
		var gender_boundary = boundaries[row[9]];
		var type = row[10].split("/");
		pokemon_name2id[name] = i;
		pokemon_data[i] = {
			id: i,
			name: name,
			stats: stats,
			abilities: [ability1, ability2],
			gender_boundary: gender_boundary,
			type1: type[0],
			type2: type[1] || type[0],
		};
	}
}

function initialize_factory_entries(factory_data_text) {
	var lines = factory_data_text.split("\n");
	if (lines[lines.length - 1] === "") lines.pop();
	factory_data = new Array(1 + lines.length);
	for (var i = 0; i < lines.length; i ++) {
		var row = lines[i].split("|");
		var pokemon = get_pokemon_entry(row[1]);
		factory_data[1 + i] = {
			id: 1 + i,
			name:   row[1],
			pokemon: pokemon,
			nature: natures.indexOf(row[2]),
			item:   row[3],
			move:   row[4].split(","),
			effort: omit_effort_text(row[5])
		};
	}
}

function initialize_trainer_names(trainer_names_text) {
	var lines = trainer_names = trainer_names_text.split("\n");
	if (lines[lines.length - 1] === "") lines.pop();
	// 300番目,301番目のトレーナーをそれぞれ銀ネジキ、金ネジキとして扱う
	silver_nejiki_id = lines.length;
	lines.push("ファクトリーヘッドのネジキ");
	gold_nejiki_id = lines.length;
	lines.push("ファクトリーヘッドのネジキ");
}

function initialize_waza(waza_csv_text) {
	var lines = waza_csv_text.split("\n");
	lines.shift(); // ヘッダ行を除去
	if (lines[lines.length - 1] === "") lines.pop();
	waza_data = new Array(1 + lines.length);
	waza_fromname = {};
	for (var i = 0; i < lines.length; i ++) {
		var row = lines[i].split(",");
		var name = row[1];
		var basePower = Number(row[2]);
		var accuracy = Number(row[3]);
		var type = row[5];
		var isPhysical = row[6] == "物理";
		var effectCode = Number(row[8]);
		var priority = Number(row[10]);
		waza_data[i + 1] = {
			id: i + 1,
			name: name,
			basePower: basePower,
			accuracy: accuracy,
			type: type,
			isPhysical: isPhysical,
			effectCode: effectCode,
			priority: priority,
		};
		waza_fromname[name] = waza_data[i + 1];
	}
}

function get_pokemon_entry(name) {
	return pokemon_data[pokemon_name2id[name]];
}

var status_names = "HP,攻撃,防御,特攻,特防,すば".split(",");

function omit_effort_text(text) {
	// ex. omit_effort_text("HP/攻撃")
	//  => "HA"
	var list = text.split("/");
	var result = "";
	for (var i = 0; i < list.length; i ++) {
		result += "HABCDS".charAt(status_names.indexOf(list[i]));
	}
	return result;
}

function effort_text_to_array(text) {
	// ex. effort_text_to_array("HA")
	//  => [255, 255, 0, 0, 0, 0]
	var t = "HABCDS";
	var efforts = [0, 0, 0, 0, 0, 0];
	for (var i = 0; i < text.length; i ++) {
		efforts[t.indexOf(text.charAt(i))] = text.length === 3 ? 170 : 255;
	}
	return efforts;
}

function entries_collision(entry, entries, visited_entries) {
	return entries_collision0(entry, entries) || entries_collision0(entry, visited_entries);
}

function entries_collision0(entry, entries) {
	for (var i = 0; i < entries.length; i ++) {
		if (entry.pokemon === entries[i].pokemon) return true;
		if (entry.item === entries[i].item) return true;
	}
	return false;
}

function is_shiny_pid(parent_id, secret_id, pid) {
	return ((parent_id ^ secret_id ^ (pid >>> 16) ^ (pid & 0xffff)) & ~7) === 0;
}
