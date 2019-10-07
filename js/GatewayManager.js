/*
 * This file is part of the Education Network Simulator project and covered 
 * by GPLv3 license. See full terms in the LICENSE file at the root folder
 * or at http://www.gnu.org/licenses/gpl-3.0.html.
 * 
 * (c) 2015 Jorge García Ochoa de Aspuru
 * bardok@gmail.com
 * 
 * Images are copyrighted by their respective authors and have been 
 * downloaded from http://pixabay.com/
 * 
 */

function createGatewaysDiv(id) 
{
    var host = network.getElement(id);
    /*var div = document.createElement("div");
    var l = window.innerWidth / 2 - 200;
    var t = window.innerHeight / 2 - 200;*/
    
    var headers = [_("Network"), _("Mask"), _("Gateway")];
    var data = host.getConnectable().getGatewayManager().getControllerData();
    var uigwtable = new UITable(headers, data, 'gwtable');
    
    /*div.setAttribute('style', 'position:absolute;top:' + t + 'px;left:' + l + 'px;z-index:110;background-color:white;width:700px;height:400px;border-radius:10px;border:1px solid;padding:10px;text-align:center;');
    div.setAttribute('id', 'divgwconfig');
    div.innerHTML = host.getConnectable().getGatewayManager().getController();*/
    
    var controls = '<input type="button" id="upload" value="'+_("Save")+'" onclick="saveGWConfig(' + id + ',\'' + uigwtable.getId() + '\');" />\
  <input type="button" id="cancel" value="'+_("Cancel")+'" onclick="cancelGWConfig(\'' + uigwtable.getId() + '\');" />';
    
    var w = new UIWindow('divgwconfig', _('Gateway Configuration'), 700, 400, false, 1.0);
    w.setContent(host.getConnectable().getGatewayManager().getController());
    w.setControls(controls);
    w.render();

    uigwtable.render();
}

function editGateways(id) 
{
    createBkDiv();
    createGatewaysDiv(id);
}

function cancelGWConfig(uitableid) 
{
    uimanager.getWindow("divgwconfig").dispose();
    removeBodyDiv('divbk');
    uitables[uitableid].dispose();
}

function saveGWConfig(id, uitableid) 
{
    var host = network.getElement(id);
    host.getConnectable().getGatewayManager().purgeGatewayInfo();
    var data = uitables[uitableid].getData();
    for (var i = 0; i < data.length; i++) 
    {
        var dst = data[i][0];
        dst = (dst === "") ? "0.0.0.0" : dst;
        var mask = data[i][1];
        mask = (mask === "") ? "0.0.0.0" : mask;
        var gw = data[i][2];
        host.getConnectable().getGatewayManager().addGatewayInfo(dst, mask, gw);
    }
    uimanager.getWindow("divgwconfig").dispose();
    removeBodyDiv('divbk');
    uitables[uitableid].dispose();
}


var GatewayManager = function(connectable) 
{
    var gateways = [];
    var _self = this;
    var defaultgw = null;
    var connectable = connectable;
    
    function init() 
    {
        _self.addGatewayInfo("0.0.0.0", "0.0.0.0", null);
    }
    
    this.addGatewayInfo = function(dst, mask, gw) 
    {
        if (isValidIPv4(dst) && ((gw === null) || (isValidIPv4(gw)))) 
        {
            var isdefaultgw = (dst === "0.0.0.0");
            var data = {};
            data.dst = dst;
            data.gw = gw;
            
            if (isdefaultgw) 
            {
                data.mask = "0.0.0.0";
                defaultgw = data;
            } 
            else 
            {
                data.mask = mask;
                gateways.push(data);
            }
        }
    };
    
    this.save = function() 
    {
        var data = {};
        data.defaultgw = defaultgw.gw;
        data.gateways = gateways;
        
        return data;
    };
    
    this.load = function(data) 
    {
        if (data !== null) 
        {
            this.addGatewayInfo("0.0.0.0", "0.0.0.0", data.defaultgw);
            for (var i = 0; i < data.gateways.length; i++) 
            {
                this.addGatewayInfo(data.gateways[i].dst, data.gateways[i].mask ? data.gateways[i].mask : "255.255.255.0", data.gateways[i].gw);
            }
        }
    };
    
    this.purgeGatewayInfo = function() 
    {
        gateways = [];
        defaultgw.gw = null;
    };
    
    this.getController = function() 
    {
        var result = "<table style='width:100%;' id='gwtable'></table>";
        return result;
    };
    
    this.getControllerData = function() 
    {
        var result = [];
        
        var defdata = [];
        if (defaultgw.gw !== null) 
        {
            defdata[0] = defaultgw.dst;
            defdata[1] = defaultgw.mask;
            defdata[2] = defaultgw.gw;
            result.push(defdata);
        }
        
        for (var i = 0; i < gateways.length; i++) 
        {
            var data = [];
            data[0] = gateways[i].dst;
            data[1] = gateways[i].mask;
            data[2] = gateways[i].gw;
            result.push(data);
        }
        
        return result;
    };
    
    this.getGatewayForIP = function(ip) 
    {
        var result = null;
        if (isValidIPv4(ip)) 
        {
            var ipint = ipStringToInt(ip);
            var i = 0;
            while ((result === null) && (i < gateways.length)) 
            {
                var dstint = ipStringToInt(gateways[i].dst);
                var maskint = ipStringToInt(gateways[i].mask);
                var dstnetwork = dstint & maskint;
                var ipnetwork = ipint & maskint;
                if (dstnetwork === ipnetwork) 
                {
                    result = gateways[i].gw;
                } 
                else 
                {
                    i++;
                }
            }
            
            if (result === null) 
            {
                result = defaultgw.gw;
            }
        }
        
        return result;
    };
    
    init();
};
