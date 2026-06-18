INSERT INTO t_p99554134_pro_trek_system_buil.suppliers (name, code, website, config)
VALUES (
    'Arlight', 'arlight', 'https://arlight.ru',
    '{"files":{"products":"https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/e49277cd-304c-496d-8ef0-a27c0183b107.json","parameters":"https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/04ec50e4-2125-4967-81b4-5671de26714b.json","groups":"https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/f5c1b50d-dbcd-4c40-bf13-3d27476c03f0.json","series":"https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/faec8c0d-1e00-45a5-9806-9cd60b13b612.json","relations":"https://cdn.poehali.dev/projects/a6ddce56-f505-4600-8cb8-11214a1f8087/bucket/e00f2419-3a1e-479c-9db6-871d48d08753.json"},"paths":{"products_array":"data.products","article":"article","name":"name","description":"texts.descript","series":"serie","brand":"brand","files":"files","groups":"groups"},"price_source":"none","image_base_url":"https://assets.transistor.ru/files/v3/sites/file.file?id="}'
)
ON CONFLICT (code) DO UPDATE SET config = EXCLUDED.config;
