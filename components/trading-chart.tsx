'use client';
import {forwardRef,useEffect,useImperativeHandle,useRef} from 'react';
import {createChart,CandlestickSeries,HistogramSeries,ColorType,CrosshairMode,type IChartApi,type ISeriesApi,type UTCTimestamp} from '@/lib/vendor/lightweight-charts/lightweight-charts.standalone.production.mjs';
import {formatChartPrice,type Candle,type Interval} from '@/lib/chart-data';
export type TradingChartHandle={zoom:(factor:number)=>void;reset:()=>void};
export const TradingChart=forwardRef<TradingChartHandle,{candles:Candle[];interval:Interval;name:string;onHover:(time:number|null)=>void}>(function TradingChart({candles,interval,name,onHover},ref){
 const host=useRef<HTMLDivElement>(null),chart=useRef<IChartApi|null>(null),price=useRef<ISeriesApi<'Candlestick'>|null>(null),volume=useRef<ISeriesApi<'Histogram'>|null>(null),initialized=useRef(false),hover=useRef(onHover);hover.current=onHover;
 function reset(){const c=chart.current;if(!c)return;c.priceScale('right').applyOptions({autoScale:true});c.timeScale().applyOptions({barSpacing:9,rightOffset:5});c.timeScale().scrollToRealTime();}
 useImperativeHandle(ref,()=>({reset,zoom(factor){const c=chart.current;if(c)c.timeScale().applyOptions({barSpacing:Math.max(2,Math.min(60,c.timeScale().options().barSpacing*factor))});}}));
 useEffect(()=>{
  if(!host.current)return;const c=createChart(host.current,{autoSize:true,height:495,layout:{background:{type:ColorType.Solid,color:'#faf8f4'},textColor:'#81766f',fontFamily:'Space Grotesk, Arial, sans-serif',fontSize:10,attributionLogo:true},grid:{vertLines:{visible:false},horzLines:{color:'#e7e0d9'}},crosshair:{mode:CrosshairMode.Normal},rightPriceScale:{borderColor:'#d1ccc5',autoScale:true,scaleMargins:{top:.08,bottom:.25},minimumWidth:85},timeScale:{borderColor:'#d1ccc5',timeVisible:interval!=='1d',secondsVisible:false,barSpacing:9,minBarSpacing:2,rightOffset:5,fixLeftEdge:false,fixRightEdge:false},handleScale:{axisPressedMouseMove:{time:true,price:true},axisDoubleClickReset:{time:true,price:true},mouseWheel:true,pinch:true},handleScroll:{mouseWheel:true,pressedMouseMove:true,horzTouchDrag:true,vertTouchDrag:true},localization:{priceFormatter:formatChartPrice}});
  const series=c.addSeries(CandlestickSeries,{upColor:'#478167',downColor:'#c55780',wickUpColor:'#478167',wickDownColor:'#c55780',borderVisible:false,priceFormat:{type:'custom',formatter:formatChartPrice,minMove:0.000000000001}});
  const bars=c.addSeries(HistogramSeries,{priceScaleId:'volume',priceFormat:{type:'volume'},priceLineVisible:false,lastValueVisible:false});bars.priceScale().applyOptions({scaleMargins:{top:.82,bottom:0},visible:false});
  chart.current=c;price.current=series;volume.current=bars;
  function applyTheme(){const dark=document.documentElement.dataset.theme==='dark';c.applyOptions({layout:{background:{type:ColorType.Solid,color:dark?'#211f22':'#faf8f4'},textColor:dark?'#b8afb7':'#81766f'},grid:{horzLines:{color:dark?'#39333b':'#e7e0d9'}},rightPriceScale:{borderColor:dark?'#49434a':'#d1ccc5'},timeScale:{borderColor:dark?'#49434a':'#d1ccc5'}});series.applyOptions({upColor:dark?'#91cba2':'#478167',downColor:dark?'#f2a0b5':'#c55780',wickUpColor:dark?'#91cba2':'#478167',wickDownColor:dark?'#f2a0b5':'#c55780'});}
  applyTheme();const themeObserver=new MutationObserver(applyTheme);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  c.subscribeCrosshairMove(e=>hover.current(typeof e.time==='number'?e.time:null));
  return()=>{themeObserver.disconnect();c.remove();chart.current=null;price.current=null;volume.current=null;initialized.current=false;};
 },[interval]);
 useEffect(()=>{if(!price.current||!volume.current)return;price.current.setData(candles.map(c=>({...c,time:c.time as UTCTimestamp})));volume.current.setData(candles.map(c=>({time:c.time as UTCTimestamp,value:c.volume,color:c.close>=c.open?'#47816766':'#c5578066'})));if(!initialized.current&&candles.length){reset();initialized.current=true;}},[candles]);
 return <div ref={host} className="interactive-market-chart" role="region" aria-label={`${name} ${interval} interactive candlestick chart`} title="Drag the price axis to scale vertically. Drag the time axis to scale horizontally. Scroll or pinch to zoom; drag the chart to pan. Double-click an axis to reset." style={{height:495,width:'100%'}}/>;
});
