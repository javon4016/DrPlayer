"""
代理服务器配置文件
可以通过环境变量或配置文件覆盖默认设置
"""

import os
from typing import Optional

class Config:
    """配置类"""
    
    # 服务器配置
    HOST: str = os.getenv("PROXY_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PROXY_PORT", "8000"))
    WORKERS: int = int(os.getenv("PROXY_WORKERS", "1"))
    
    # 连接池配置
    MAX_CONNECTIONS: int = int(os.getenv("PROXY_MAX_CONNECTIONS", "100"))
    MAX_KEEPALIVE_CONNECTIONS: int = int(os.getenv("PROXY_MAX_KEEPALIVE_CONNECTIONS", "20"))
    KEEPALIVE_EXPIRY: float = float(os.getenv("PROXY_KEEPALIVE_EXPIRY", "30.0"))
    
    # 超时配置
    CONNECT_TIMEOUT: float = float(os.getenv("PROXY_CONNECT_TIMEOUT", "10.0"))
    READ_TIMEOUT: float = float(os.getenv("PROXY_READ_TIMEOUT", "60.0"))
    WRITE_TIMEOUT: float = float(os.getenv("PROXY_WRITE_TIMEOUT", "10.0"))
    POOL_TIMEOUT: float = float(os.getenv("PROXY_POOL_TIMEOUT", "5.0"))
    
    # 内存监控配置
    MEMORY_CHECK_INTERVAL: int = int(os.getenv("PROXY_MEMORY_CHECK_INTERVAL", "30"))
    MAX_MEMORY_USAGE: int = int(os.getenv("PROXY_MAX_MEMORY_USAGE", "500"))
    CLEANUP_THRESHOLD: int = int(os.getenv("PROXY_CLEANUP_THRESHOLD", "400"))
    
    # 日志配置
    LOG_LEVEL: str = os.getenv("PROXY_LOG_LEVEL", "INFO")
    LOG_FILE: Optional[str] = os.getenv("PROXY_LOG_FILE", "proxy.log")
    
    # 安全配置
    VERIFY_SSL: bool = os.getenv("PROXY_VERIFY_SSL", "false").lower() == "true"
    ALLOWED_HOSTS: Optional[str] = os.getenv("PROXY_ALLOWED_HOSTS")  # 逗号分隔的主机列表
    
    # 性能配置
    CHUNK_SIZE: int = int(os.getenv("PROXY_CHUNK_SIZE", "8192"))
    ENABLE_COMPRESSION: bool = os.getenv("PROXY_ENABLE_COMPRESSION", "true").lower() == "true"
    
    @classmethod
    def get_allowed_hosts(cls) -> list:
        """获取允许的主机列表"""
        if cls.ALLOWED_HOSTS:
            return [host.strip() for host in cls.ALLOWED_HOSTS.split(",")]
        return ["*"]  # 默认允许所有主机
    
    @classmethod
    def load_from_file(cls, config_file: str):
        """从配置文件加载配置"""
        try:
            import json
            with open(config_file, 'r', encoding='utf-8') as f:
                config_data = json.load(f)
            
            for key, value in config_data.items():
                if hasattr(cls, key.upper()):
                    setattr(cls, key.upper(), value)
        except FileNotFoundError:
            pass  # 配置文件不存在时使用默认值
        except Exception as e:
            print(f"加载配置文件失败: {e}")
    
    @classmethod
    def save_to_file(cls, config_file: str):
        """保存配置到文件"""
        import json
        
        config_data = {}
        for attr in dir(cls):
            if attr.isupper() and not attr.startswith('_'):
                config_data[attr.lower()] = getattr(cls, attr)
        
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config_data, f, indent=2, ensure_ascii=False)

# 默认配置实例
config = Config()

# 尝试加载配置文件
config.load_from_file("proxy_config.json")