/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Pronin Anton
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */
 
 /**
 * Load js file
 * @var path string path to js file
 * @var next function callback where load file wiil be done;
 */
function putModule(path,next)
{
	var head= document.getElementsByTagName('head')[0];
	var script= document.createElement('script');
	script.type= 'text/javascript';	
	script.onload = function(){
		execute(next);
	}
	script.onreadystatechange = function(){
		if (script.readyState == "loaded" ||
				script.readyState == "complete"){
				script.onreadystatechange = null;
				execute(next);
		}
	};	
	script.src= path;
	head.appendChild(script);
}

function execute(funct)
{
	if( funct instanceof Function)
		funct();
	else{
		if(typeof(funct)=="string" && window[funct] != undefined)
			window[funct]();
	}
}

/**
 * Load css file
 * @var path string path to css file 
 */
function putCss(path)
{
	var head= document.getElementsByTagName('head')[0];
	var fileref=document.createElement("link")
	fileref.setAttribute("rel", "stylesheet")
	fileref.setAttribute("type", "text/css")
	fileref.setAttribute("href", path)
	head.appendChild(fileref);
}

/**
 * Load view file
 * @var path string path to view file
 * @var parent Object parent of view
 * @var callback function raised when view-file will be done
 */
function loadView(path,parent,callback)
{
	$.ajax(path,
	{
		type:"GET",
		dataType:"json",
		context:{"parent":parent,"callback":callback},
		success:prepareView,
		error:errorLoadView
	});
}

/**
 * Load sub view
 * @var path string path to view file
 * @var parent Object parent of view
 * @var callback function raised when view-file will be done
 * @var params Array of parameter for template sub view
 */
function loadSubView(path,callback,parent,params)
{
	$.ajax(path,
	{
		type:"GET",
		dataType:"json",
		context:{parent:parent,params:params},
		success:callback
	});
}

/**
 * Error handler
 */
function errorLoadView(request)
{
	console.log(request);
}

/**
 * Prepare view to shown
 * @var request jsonObject view-object;
 */
function prepareView(request)
{
	object = this;
	parent = $(object.parent);
	element_top = newElement(request.type,request.class,request.id,parent);
	prepareContentBlock(request.content,element_top);
	if(object.callback != null)
		object.callback();
}

/**
 * Create a new block UI
 * @var content jsonObject object for add
 * @var parent Object parent of content
 */
function prepareContentBlock(content,parent)
{
	if(content instanceof  Array)
	{
		for(index in content)
		{
			block = content[index];
			element = newElementText(block.type,block.class,block.id,block.text,parent);
			prepareContentBlock(block.content,element);
		}
	}
}

/**
 * Create new element with content
 * @var type string type of element
 * @var classes string list of classes 
 * @var _id string identefical of element
 * @var text string content of element
 * @var parent Object parent of element
 */
function newElementText(type,classes,_id,text,parent)
{
	element = newElement(type,classes,_id,parent);
	element.text(text);
	return element;
}

/**
 * Create new element without content
 * @var type string type of element
 * @var classes string list of classes 
 * @var _id string identefical of element

 * @var parent Object parent of element
 */
function newElement(type,classes,_id,parent)
{
	element = $("<"+type+"/>",{
		id:_id,
		class:classes
	})
	element.appendTo(parent);
	return element;
}

/**
 * Default callback sub-view
 * @var view jsonObject 
 */
function callbackSubView(view)
{
	if(view.context == undefined)
	{
		parent = newElement(view.type,view.class,view.id,this.parent);
		for( index in view.content )
		{
			object = view.content[index];
			element = newElementText(object.type,object.class,object.id,object.text,parent);
			if(object.context != undefined)
			{
				context = object.context;
				window[context.callback](element,context.view,this.params);
			}
		}
	}
	$(".loader-placeholder").fadeOut();
}

function processParam(param,params)
{
	if(params!=undefined)
	{
		if(typeof(param)==="string")
		{
			arParams = /{\w+}/.exec(param);
			if(arParams!=null)
			{
				for(inRex=0;inRex<arParams.length;inRex++)
				{
					p1 = arParams[inRex];
					p2 = p1.substring(1,p1.length-1);
					if(params[p2] != undefined)
					{
						if(typeof(params[p2])==="object")
							param = params[p2];
						else
							param = param.replace(p1,params[p2]);
					}else{
						param = param.replace(p1,null);
					}
				}
			}
		}else{
			if(param instanceof Object)
			{
				for(index in param)
				{
					object = param[index];
					param[index] = processParam(object,params);
				}
			}
		}
	}
	
	return param;
}

function procesElement(o,request,index,parent)
{
	params = o;
	elementParent_ = newElement(request.type,request.class,request.object+"-"+index,parent);
	elementParent_.attr('object-id',o.id);
	elementParent_.text(o[request.data]);
	for(i in request.content)
	{
		sub = request.content[i];
		elementData = sub.data;
		elemSub = null;
		if(elementData instanceof Object)
		{
			d = o[elementData.name][elementData.index];
			elemSub = newElementText(sub.type,sub.class,sub.id,processParam(d,params),elementParent_);
		}else{
			if(elementData != undefined)
				elemSub = newElementText(sub.type,sub.class,sub.id,processParam(o[elementData],params),elementParent_);
			else
				elemSub = newElementText(sub.type,sub.class,sub.id,sub.text,elementParent_);
		}
		if(sub.context!=undefined)
		{
			if(sub.context instanceof Object)
			{
				if(sub.context.callback!=undefined && window[sub.context.callback] != undefined)
				{
					if(sub.context.data!=undefined)
					{
						this_ =  {"parent":parent,"params":processParam(sub.context.data,params)};
						window[sub.context.callback].call(this_,elemSub,null);
						
					}
				}
			}
		}
		if(sub.onclick!=undefined && window[sub.onclick]!=undefined)
			$("#"+sub.id).on("click",window[sub.onclick]);
	}
	if(request.onclick!=undefined && window[request.onclick]!=undefined)
		$("#"+request.object+"-"+index).on("click",window[request.onclick]);
}

putModule('/js/vendors/jquery-2.1.1.min.js',start);