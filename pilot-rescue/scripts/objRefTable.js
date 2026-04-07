const C3 = self.C3;
self.C3_GetObjectRefTable = function () {
	return [
		C3.Plugins.Sprite,
		C3.Behaviors.solid,
		C3.Behaviors.EightDir,
		C3.Behaviors.scrollto,
		C3.Behaviors.bound,
		C3.Plugins.Keyboard,
		C3.Plugins.System.Cnds.OnLayoutStart,
		C3.Plugins.System.Acts.CreateObject,
		C3.Plugins.System.Exps.int,
		C3.Plugins.System.Exps.random,
		C3.Plugins.System.Acts.ScrollX,
		C3.Plugins.Sprite.Exps.X,
		C3.Plugins.System.Acts.ScrollY,
		C3.Plugins.Sprite.Exps.Y,
		C3.Plugins.System.Cnds.For,
		C3.Plugins.System.Exps.loopindex,
		C3.Plugins.System.Cnds.Repeat,
		C3.Plugins.System.Cnds.EveryTick,
		C3.Plugins.Sprite.Cnds.IsOverlapping,
		C3.Behaviors.EightDir.Acts.SetMaxSpeed
	];
};
self.C3_JsPropNameTable = [
	{terrain_dirt_a: 0},
	{terrain_sand_a: 0},
	{Solid: 0},
	{terrain_dirt_block_center: 0},
	{"8Direction": 0},
	{ScrollTo: 0},
	{BoundTo: 0},
	{Soldier: 0},
	{Keyboard: 0},
	{bush3: 0},
	{womanGreen_stand: 0},
	{CellSize: 0},
	{GridWidth: 0},
	{GridHeight: 0},
	{Speed: 0}
];

self.InstanceType = {
	terrain_dirt_a: class extends self.ISpriteInstance {},
	terrain_sand_a: class extends self.ISpriteInstance {},
	terrain_dirt_block_center: class extends self.ISpriteInstance {},
	Soldier: class extends self.ISpriteInstance {},
	Keyboard: class extends self.IInstance {},
	bush3: class extends self.ISpriteInstance {},
	womanGreen_stand: class extends self.ISpriteInstance {}
}