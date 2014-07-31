function initModule()
{
	putCss('/css/example.css');
	loadView('/js/modules/example/views',$('body'));
}

function clickOnDiv(item)
{
	alert("Hello world");
}