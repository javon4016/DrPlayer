import Hls from 'hls.js';
import flvjs from 'flv.js';
import shaka from 'shaka-player/dist/shaka-player.compiled';
import { getCSPConfig } from '@/utils/csp';

// 播放器配置选项
const playerOptions = {
    hls: {
        maxBufferLength: 600, // 缓冲区最大长度
        liveSyncDurationCount: 10, // 直播同步持续时间计数
    },
    flv: {
        mediaDataSource: {
            type: 'flv',
            isLive: false,
        },
        optionalConfig: {
            enableWorker: false, // 启用分离线程
            enableStashBuffer: false, // 关闭IO隐藏缓冲区
            autoCleanupSourceBuffer: true, // 自动清除缓存
            reuseRedirectedURL: true, // 允许重定向请求
            fixAudioTimestampGap: false, // 音视频同步
            deferLoadAfterSourceOpen: false, // 允许延迟加载
            headers: {},
        },
    },
    dash: {},
};

// 视频格式检测
export const detectVideoFormat = (url) => {
    // 确保url是字符串类型
    if (typeof url !== 'string') {
        console.warn('detectVideoFormat: url must be a string, received:', typeof url, url);
        return 'native';
    }
    const urlLower = url.toLowerCase();
    if (urlLower.includes('.m3u8') || urlLower.includes('m3u8')) {
        return 'hls';
    } else if (urlLower.includes('.flv') || urlLower.includes('flv')) {
        return 'flv';
    } else if (urlLower.includes('.mpd') || urlLower.includes('mpd')) {
        return 'dash';
    } else if (urlLower.includes('.ts') || urlLower.includes('ts')) {
        return 'mpegts';
    } else if (urlLower.includes('magnet:') || urlLower.includes('.torrent')) {
        return 'torrent';
    }
    return 'native';
};

// 自定义播放器创建函数
export const createCustomPlayer = {
    // HLS 播放器
    hls: (video, url, headers = {}) => {
        console.log('🎬 [HLS播放器] 开始播放视频:')
        console.log('📺 视频地址:', url)
        console.log('📋 请求头:', headers)
        
        if (Hls.isSupported()) {
            const options = Object.assign({}, { ...playerOptions.hls });
            
            // 设置 XHR 配置，处理 referer 和自定义 headers
            options.xhrSetup = function (xhr, _url) {
                // 检查 CSP 绕过开关状态，只有开启时才禁用 referer 发送
                const cspConfig = getCSPConfig();
                if (cspConfig.autoBypass) {
                    Object.defineProperty(xhr, 'referrer', {
                        value: '',
                        writable: false
                    });
                }
                
                // 设置自定义请求头
                if (Object.keys(headers).length > 0) {
                    for (const key in headers) {
                        xhr.setRequestHeader(key, headers[key]);
                    }
                }
            };
            
            const hls = new Hls(options);
            hls.loadSource(url);
            hls.attachMedia(video);
            return hls;
        } else {
            console.log('HLS is not supported.');
            return null;
        }
    },

    // FLV 播放器
    flv: (video, url, headers = {}) => {
        console.log('🎬 [FLV播放器] 开始播放视频:')
        console.log('📺 视频地址:', url)
        console.log('📋 请求头:', headers)
        
        if (flvjs.isSupported()) {
            const flvPlayer = flvjs.createPlayer(
                Object.assign({}, { ...playerOptions.flv.mediaDataSource }, { url: url }),
                Object.assign({}, { ...playerOptions.flv.optionalConfig }, { headers }),
            );
            flvPlayer.attachMediaElement(video);
            flvPlayer.load();
            return flvPlayer;
        } else {
            console.log('FLV is not supported.');
            return null;
        }
    },

    // DASH 播放器
    dash: (video, url, headers = {}) => {
        console.log('🎬 [DASH播放器] 开始播放视频:')
        console.log('📺 视频地址:', url)
        console.log('📋 请求头:', headers)
        
        if (shaka.Player.isBrowserSupported()) {
            const playerShaka = new shaka.Player(video);
            
            // 设置请求过滤器处理自定义请求头
            playerShaka.getNetworkingEngine().registerRequestFilter(function (type, request) {
                if (type != shaka.net.NetworkingEngine.RequestType.MANIFEST) {
                    return;
                }
                for (const header in headers) {
                    request.headers[header] = headers[header];
                }
            });
            
            playerShaka.load(url);
            const options = playerOptions.dash;
            playerShaka.configure(options);
            return playerShaka;
        } else {
            console.log('DASH is not supported.');
            return null;
        }
    },
};

// 播放器切换函数
export const switchCustomPlayer = {
    hls: (video, hls, url) => {
        hls.stopLoad();
        hls.detachMedia();

        // 重新加载新的 M3U8 URL
        hls.loadSource(url);
        hls.attachMedia(video);

        // 等待新流解析完成并开始播放
        hls.once(Hls.Events.MANIFEST_PARSED, () => {
            video.play();
        });
        return hls;
    },

    flv: (video, flv, url) => {
        flv.pause();
        flv.unload();
        flv.detachMediaElement();
        flv.destroy();
        
        flv = flvjs.createPlayer(
            Object.assign({}, playerOptions.flv.mediaDataSource || {}, { url: url }),
            playerOptions.flv.optionalConfig || {},
        );
        flv.attachMediaElement(video);
        flv.load();
        return flv;
    },

    dash: (video, dash, url) => {
        dash.destroy();
        const playerShaka = new shaka.Player(video);
        playerShaka.load(url);
        const options = playerOptions.dash;
        playerShaka.configure(options);
        return playerShaka;
    },
};

// 播放器销毁函数
export const destroyCustomPlayer = {
    hls: (player) => {
        if (player?.hls) {
            player.hls.destroy();
            delete player.hls;
        }
    },

    flv: (player) => {
        if (player?.flv) {
            player.flv.destroy();
            delete player.flv;
        }
    },

    dash: (player) => {
        if (player?.dash) {
            player.dash.destroy();
            delete player.dash;
        }
    },
};

// 统一的播放器管理器
export class MediaPlayerManager {
    constructor(video) {
        this.video = video;
        this.currentPlayer = null;
        this.currentFormat = 'native';
    }

    // 加载视频
    loadVideo(url, headers = {}) {
        const format = detectVideoFormat(url);
        
        // 如果格式改变，先销毁当前播放器
        if (this.currentFormat !== format && this.currentPlayer) {
            this.destroy();
        }

        this.currentFormat = format;

        switch (format) {
            case 'hls':
                this.currentPlayer = createCustomPlayer.hls(this.video, url, headers);
                break;
            case 'flv':
                this.currentPlayer = createCustomPlayer.flv(this.video, url, headers);
                break;
            case 'dash':
                this.currentPlayer = createCustomPlayer.dash(this.video, url, headers);
                break;
            default:
                // 原生支持的格式
                console.log('🎬 [原生播放器] 开始播放视频:')
                console.log('📺 视频地址:', url)
                console.log('📋 请求头:', headers)
                this.video.src = url;
                this.currentPlayer = null;
                break;
        }

        return this.currentPlayer;
    }

    // 切换视频源
    switchVideo(url) {
        const format = detectVideoFormat(url);
        
        if (format === this.currentFormat && this.currentPlayer) {
            // 相同格式，使用切换函数
            switch (format) {
                case 'hls':
                    this.currentPlayer = switchCustomPlayer.hls(this.video, this.currentPlayer, url);
                    break;
                case 'flv':
                    this.currentPlayer = switchCustomPlayer.flv(this.video, this.currentPlayer, url);
                    break;
                case 'dash':
                    this.currentPlayer = switchCustomPlayer.dash(this.video, this.currentPlayer, url);
                    break;
            }
        } else {
            // 不同格式，重新加载
            this.loadVideo(url);
        }
    }

    // 销毁播放器
    destroy() {
        if (this.currentPlayer) {
            switch (this.currentFormat) {
                case 'hls':
                    destroyCustomPlayer.hls({ hls: this.currentPlayer });
                    break;
                case 'flv':
                    destroyCustomPlayer.flv({ flv: this.currentPlayer });
                    break;
                case 'dash':
                    destroyCustomPlayer.dash({ dash: this.currentPlayer });
                    break;
            }
            this.currentPlayer = null;
        }
        this.currentFormat = 'native';
    }

    // 获取当前播放器
    getCurrentPlayer() {
        return this.currentPlayer;
    }

    // 获取当前格式
    getCurrentFormat() {
        return this.currentFormat;
    }
}