import{c as r}from"./createLucideIcon-0cf0090d.js";/**
 * @license lucide-vue-next v0.536.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const a=r("dollar-sign",[["line",{x1:"12",x2:"12",y1:"2",y2:"22",key:"7eqyqh"}],["path",{d:"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",key:"1b0p4s"}]]);function o(e){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:0}).format(e)}function i(e){return new Intl.NumberFormat("en-US").format(e)}function u(e){if(!e)return"N/A";const t=new Date(e);return isNaN(t.getTime())?"N/A":new Intl.DateTimeFormat("en-US",{year:"numeric",month:"short",day:"numeric"}).format(t)}function m(e){return{"On Track":"bg-green-100 text-green-800","At Risk":"bg-yellow-100 text-yellow-800",Delayed:"bg-red-100 text-red-800",Completed:"bg-blue-100 text-blue-800",Active:"bg-green-100 text-green-800",Inactive:"bg-gray-100 text-gray-800",Current:"bg-green-100 text-green-800","Update Required":"bg-red-100 text-red-800"}[e]||"bg-gray-100 text-gray-800"}export{a as D,o as a,i as b,u as f,m as g};
