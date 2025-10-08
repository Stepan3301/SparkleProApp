-- Updated Email Templates with Modern Design
-- Based on email-template-confirm.txt design

-- 1. Order Created Template (when customer creates booking)
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Created - SparklePro</title>
    <style>
        :root{
            --primary:#0ABDC6; --accent:#00E6B8; --violet:#6c5dd3;
            --ink:#0f172a; --muted:#5b7a88; --line:#dbe8ee; --bg:#f7fbfd;
            --card:#fff; --shadow:0 12px 28px rgba(10,30,40,.10);
        }
        *{box-sizing:border-box}
        body{margin:0;background:var(--bg);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:12px}
        
        .order-success{max-width:520px;margin:0 auto;}
        
        /* Header / hero */
        .hero{
            position:relative;border-radius:22px;padding:22px 14px 18px;color:#fff;
            background: radial-gradient(120% 100% at 100% -20%, #c8fff1 0%, transparent 55%),
                       radial-gradient(120% 100% at 0% 120%, #b7f8ff 0%, transparent 60%),
                       linear-gradient(135deg, var(--violet), #36c2cf);
            box-shadow: var(--shadow); overflow:hidden; text-align:center;
        }
        .hero-gloss{position:absolute;inset:-30% -10% auto -10%;height:70%;
            background:radial-gradient(closest-side, rgba(255,255,255,.55), transparent);
            mix-blend-mode:screen;pointer-events:none}
        
        .check{display:grid;place-items:center;margin:4px 0 6px}
        .check-svg{width:64px;height:64px}
        .check-ring{fill:none;stroke:rgba(255,255,255,.6);stroke-width:2;opacity:.6}
        .check-mark{fill:none;stroke:#fff;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:48;stroke-dashoffset:48;animation:draw .7s .15s ease forwards}
        @keyframes draw{to{stroke-dashoffset:0}}
        
        .hero h1{margin:4px 6px 6px;font-size:1.15rem;line-height:1.35;font-weight:900;letter-spacing:.2px;text-shadow:0 2px 12px rgba(0,0,0,.25)}
        .sub{margin:0 8px 6px;opacity:.95;font-size:0.9rem}
        
        /* Card summary */
        .card{
            background:var(--card);border:1px solid var(--line);border-radius:18px;padding:12px;margin-top:12px;box-shadow:var(--shadow)
        }
        .row{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .kv{display:flex;flex-direction:column}
        .k{font-size:.78rem;color:#54727f;font-weight:800}
        .v{font-weight:900;color:var(--ink)}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
        .pill{
            display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;font-size:.78rem;font-weight:900;white-space:nowrap
        }
        .pill--pending{background:rgba(255,200,60,.18);color:#8a6311;border:1px solid rgba(255,200,60,.45)}
        
        /* Steps (timeline) */
        .steps{list-style:none;margin:12px 0 2px;padding:0;display:flex;justify-content:space-between}
        .steps li{display:flex;flex-direction:column;align-items:center;gap:6px;color:#6a8793;font-size:.78rem}
        .steps .dot{width:10px;height:10px;border-radius:50%;background:#dbe8ee;box-shadow:inset 0 0 0 1px #c5d6de}
        .steps li.done .dot{background:linear-gradient(135deg,var(--primary),var(--accent));box-shadow:0 6px 14px rgba(10,189,198,.35)}
        .steps li.current .dot{background:#fff;box-shadow:inset 0 0 0 2px var(--primary), 0 0 0 6px rgba(10,189,198,.18)}
        .steps .txt{max-width:80px;text-align:center}
        
        /* Actions */
        .actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
        .btn{border:0;border-radius:14px;padding:12px 14px;font-weight:900;cursor:pointer;transition:transform .12s ease,filter .2s ease;text-decoration:none;display:inline-block;text-align:center}
        .btn--primary{color:#fff;background:linear-gradient(135deg,var(--primary),var(--accent));box-shadow:0 10px 24px rgba(10,189,198,.25)}
        .btn--ghost{background:#fff;border:1px solid var(--line);color:#08383c}
        
        /* Help */
        .help{display:flex;align-items:center;gap:10px;margin:10px 2px}
        .help .ico{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;background:rgba(10,189,198,.12);color:var(--primary)}
        .help a{color:#0a6d78;text-decoration:none;font-weight:800}
        
        @media (max-width:360px){ .grid{grid-template-columns:1fr} }
    </style>
</head>
<body>
    <div class="order-success">
        <header class="hero">
            <div class="hero-gloss"></div>
            
            <div class="check">
                <svg viewBox="0 0 52 52" class="check-svg">
                    <circle class="check-ring" cx="26" cy="26" r="24" />
                    <path class="check-mark" d="M16 27l6 6 14-14" />
                </svg>
            </div>
            
            <h1>Your order was created successfully</h1>
            <p class="sub">We''re reviewing your request now. You''ll get a notification as soon as the status updates.</p>
        </header>
        
        <article class="card">
            <div class="row">
                <div class="kv">
                    <span class="k">Order ID</span>
                    <span class="v">{{booking_number}}</span>
                </div>
                <span class="pill pill--pending">Pending review</span>
            </div>
            
            <div class="grid">
                <div class="kv">
                    <span class="k">Customer</span>
                    <span class="v">{{customer_name}}</span>
                </div>
                <div class="kv">
                    <span class="k">Service date</span>
                    <span class="v">{{service_date}}</span>
                </div>
                <div class="kv">
                    <span class="k">Service</span>
                    <span class="v">{{service_name}}</span>
                </div>
                <div class="kv">
                    <span class="k">Address</span>
                    <span class="v">{{service_address}}</span>
                </div>
            </div>
            
            <ol class="steps">
                <li class="done">
                    <span class="dot"></span>
                    <span class="txt">Created</span>
                </li>
                <li class="current">
                    <span class="dot"></span>
                    <span class="txt">Under review</span>
                </li>
                <li>
                    <span class="dot"></span>
                    <span class="txt">Confirmed</span>
                </li>
                <li>
                    <span class="dot"></span>
                    <span class="txt">Completed</span>
                </li>
            </ol>
        </article>
        
        <div class="actions">
            <a href="{{app_url}}" class="btn btn--primary">View order</a>
            <a href="{{app_url}}" class="btn btn--ghost">Book again</a>
        </div>
        
        <aside class="help">
            <div class="ico">
                <svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 1 5 11.9V17a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-3.1A7 7 0 0 1 12 2Z"/><path d="M9 20h6"/></svg>
            </div>
            <p>Need to change something? <a href="mailto:sparklencs@gmail.com">Contact support</a></p>
        </aside>
    </div>
</body>
</html>'
WHERE template_name = 'order_created';

-- 2. Order Confirmed Template (when admin confirms booking)
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmed - SparklePro</title>
    <style>
        :root{
            --primary:#0ABDC6; --accent:#00E6B8; --violet:#6c5dd3;
            --ink:#0f172a; --muted:#5b7a88; --line:#dbe8ee; --bg:#f7fbfd;
            --card:#fff; --shadow:0 12px 28px rgba(10,30,40,.10);
        }
        *{box-sizing:border-box}
        body{margin:0;background:var(--bg);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:12px}
        
        .order-success{max-width:520px;margin:0 auto;}
        
        .hero{
            position:relative;border-radius:22px;padding:22px 14px 18px;color:#fff;
            background: radial-gradient(120% 100% at 100% -20%, #c8fff1 0%, transparent 55%),
                       radial-gradient(120% 100% at 0% 120%, #b7f8ff 0%, transparent 60%),
                       linear-gradient(135deg, var(--primary), var(--accent));
            box-shadow: var(--shadow); overflow:hidden; text-align:center;
        }
        .hero-gloss{position:absolute;inset:-30% -10% auto -10%;height:70%;
            background:radial-gradient(closest-side, rgba(255,255,255,.55), transparent);
            mix-blend-mode:screen;pointer-events:none}
        
        .check{display:grid;place-items:center;margin:4px 0 6px}
        .check-svg{width:64px;height:64px}
        .check-ring{fill:none;stroke:rgba(255,255,255,.6);stroke-width:2;opacity:.6}
        .check-mark{fill:none;stroke:#fff;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:48;stroke-dashoffset:48;animation:draw .7s .15s ease forwards}
        @keyframes draw{to{stroke-dashoffset:0}}
        
        .hero h1{margin:4px 6px 6px;font-size:1.15rem;line-height:1.35;font-weight:900;letter-spacing:.2px;text-shadow:0 2px 12px rgba(0,0,0,.25)}
        .sub{margin:0 8px 6px;opacity:.95;font-size:0.9rem}
        
        .card{
            background:var(--card);border:1px solid var(--line);border-radius:18px;padding:12px;margin-top:12px;box-shadow:var(--shadow)
        }
        .row{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .kv{display:flex;flex-direction:column}
        .k{font-size:.78rem;color:#54727f;font-weight:800}
        .v{font-weight:900;color:var(--ink)}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
        .pill{
            display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;font-size:.78rem;font-weight:900;white-space:nowrap
        }
        .pill--confirmed{background:rgba(16,185,129,.18);color:#0a6d3b;border:1px solid rgba(16,185,129,.45)}
        
        .steps{list-style:none;margin:12px 0 2px;padding:0;display:flex;justify-content:space-between}
        .steps li{display:flex;flex-direction:column;align-items:center;gap:6px;color:#6a8793;font-size:.78rem}
        .steps .dot{width:10px;height:10px;border-radius:50%;background:#dbe8ee;box-shadow:inset 0 0 0 1px #c5d6de}
        .steps li.done .dot{background:linear-gradient(135deg,var(--primary),var(--accent));box-shadow:0 6px 14px rgba(10,189,198,.35)}
        .steps li.current .dot{background:#fff;box-shadow:inset 0 0 0 2px var(--primary), 0 0 0 6px rgba(10,189,198,.18)}
        .steps .txt{max-width:80px;text-align:center}
        
        .actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
        .btn{border:0;border-radius:14px;padding:12px 14px;font-weight:900;cursor:pointer;transition:transform .12s ease,filter .2s ease;text-decoration:none;display:inline-block;text-align:center}
        .btn--primary{color:#fff;background:linear-gradient(135deg,var(--primary),var(--accent));box-shadow:0 10px 24px rgba(10,189,198,.25)}
        .btn--ghost{background:#fff;border:1px solid var(--line);color:#08383c}
        
        .help{display:flex;align-items:center;gap:10px;margin:10px 2px}
        .help .ico{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;background:rgba(10,189,198,.12);color:var(--primary)}
        .help a{color:#0a6d78;text-decoration:none;font-weight:800}
        
        @media (max-width:360px){ .grid{grid-template-columns:1fr} }
    </style>
</head>
<body>
    <div class="order-success">
        <header class="hero">
            <div class="hero-gloss"></div>
            
            <div class="check">
                <svg viewBox="0 0 52 52" class="check-svg">
                    <circle class="check-ring" cx="26" cy="26" r="24" />
                    <path class="check-mark" d="M16 27l6 6 14-14" />
                </svg>
            </div>
            
            <h1>🎉 Your booking is confirmed!</h1>
            <p class="sub">Great news! Your cleaning service has been scheduled and confirmed.</p>
        </header>
        
        <article class="card">
            <div class="row">
                <div class="kv">
                    <span class="k">Order ID</span>
                    <span class="v">{{booking_number}}</span>
                </div>
                <span class="pill pill--confirmed">Confirmed</span>
            </div>
            
            <div class="grid">
                <div class="kv">
                    <span class="k">Customer</span>
                    <span class="v">{{customer_name}}</span>
                </div>
                <div class="kv">
                    <span class="k">Service date</span>
                    <span class="v">{{service_date}} at {{service_time}}</span>
                </div>
                <div class="kv">
                    <span class="k">Service</span>
                    <span class="v">{{service_name}}</span>
                </div>
                <div class="kv">
                    <span class="k">Address</span>
                    <span class="v">{{service_address}}</span>
                </div>
            </div>
            
            <ol class="steps">
                <li class="done">
                    <span class="dot"></span>
                    <span class="txt">Created</span>
                </li>
                <li class="done">
                    <span class="dot"></span>
                    <span class="txt">Reviewed</span>
                </li>
                <li class="current">
                    <span class="dot"></span>
                    <span class="txt">Confirmed</span>
                </li>
                <li>
                    <span class="dot"></span>
                    <span class="txt">Completed</span>
                </li>
            </ol>
        </article>
        
        <div class="actions">
            <a href="{{app_url}}" class="btn btn--primary">View booking</a>
            <a href="{{app_url}}" class="btn btn--ghost">Book another</a>
        </div>
        
        <aside class="help">
            <div class="ico">
                <svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 1 5 11.9V17a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-3.1A7 7 0 0 1 12 2Z"/><path d="M9 20h6"/></svg>
            </div>
            <p>Need to make changes? <a href="mailto:sparklencs@gmail.com">Contact support</a></p>
        </aside>
    </div>
</body>
</html>'
WHERE template_name = 'order_confirmed';

-- 3. Order Completed Template (when service is finished)
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Service Completed - SparklePro</title>
    <style>
        :root{
            --primary:#0ABDC6; --accent:#00E6B8; --violet:#6c5dd3;
            --ink:#0f172a; --muted:#5b7a88; --line:#dbe8ee; --bg:#f7fbfd;
            --card:#fff; --shadow:0 12px 28px rgba(10,30,40,.10);
        }
        *{box-sizing:border-box}
        body{margin:0;background:var(--bg);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:12px}
        
        .order-success{max-width:520px;margin:0 auto;}
        
        .hero{
            position:relative;border-radius:22px;padding:22px 14px 18px;color:#fff;
            background: radial-gradient(120% 100% at 100% -20%, #fef3c7 0%, transparent 55%),
                       radial-gradient(120% 100% at 0% 120%, #d1fae5 0%, transparent 60%),
                       linear-gradient(135deg, #10b981, #059669);
            box-shadow: var(--shadow); overflow:hidden; text-align:center;
        }
        .hero-gloss{position:absolute;inset:-30% -10% auto -10%;height:70%;
            background:radial-gradient(closest-side, rgba(255,255,255,.55), transparent);
            mix-blend-mode:screen;pointer-events:none}
        
        .check{display:grid;place-items:center;margin:4px 0 6px}
        .check-svg{width:64px;height:64px}
        .check-ring{fill:none;stroke:rgba(255,255,255,.6);stroke-width:2;opacity:.6}
        .check-mark{fill:none;stroke:#fff;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:48;stroke-dashoffset:48;animation:draw .7s .15s ease forwards}
        @keyframes draw{to{stroke-dashoffset:0}}
        
        .hero h1{margin:4px 6px 6px;font-size:1.15rem;line-height:1.35;font-weight:900;letter-spacing:.2px;text-shadow:0 2px 12px rgba(0,0,0,.25)}
        .sub{margin:0 8px 6px;opacity:.95;font-size:0.9rem}
        
        .card{
            background:var(--card);border:1px solid var(--line);border-radius:18px;padding:12px;margin-top:12px;box-shadow:var(--shadow)
        }
        .row{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .kv{display:flex;flex-direction:column}
        .k{font-size:.78rem;color:#54727f;font-weight:800}
        .v{font-weight:900;color:var(--ink)}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
        .pill{
            display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;font-size:.78rem;font-weight:900;white-space:nowrap
        }
        .pill--completed{background:rgba(16,185,129,.18);color:#0a6d3b;border:1px solid rgba(16,185,129,.45)}
        
        .steps{list-style:none;margin:12px 0 2px;padding:0;display:flex;justify-content:space-between}
        .steps li{display:flex;flex-direction:column;align-items:center;gap:6px;color:#6a8793;font-size:.78rem}
        .steps .dot{width:10px;height:10px;border-radius:50%;background:#dbe8ee;box-shadow:inset 0 0 0 1px #c5d6de}
        .steps li.done .dot{background:linear-gradient(135deg,#10b981,#059669);box-shadow:0 6px 14px rgba(16,185,129,.35)}
        .steps li.current .dot{background:#fff;box-shadow:inset 0 0 0 2px #10b981, 0 0 0 6px rgba(16,185,129,.18)}
        .steps .txt{max-width:80px;text-align:center}
        
        .actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
        .btn{border:0;border-radius:14px;padding:12px 14px;font-weight:900;cursor:pointer;transition:transform .12s ease,filter .2s ease;text-decoration:none;display:inline-block;text-align:center}
        .btn--primary{color:#fff;background:linear-gradient(135deg,#f59e0b,#d97706);box-shadow:0 10px 24px rgba(245,158,11,.25)}
        .btn--ghost{background:#fff;border:1px solid var(--line);color:#08383c}
        
        .help{display:flex;align-items:center;gap:10px;margin:10px 2px}
        .help .ico{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;background:rgba(16,185,129,.12);color:#10b981}
        .help a{color:#0a6d78;text-decoration:none;font-weight:800}
        
        @media (max-width:360px){ .grid{grid-template-columns:1fr} }
    </style>
</head>
<body>
    <div class="order-success">
        <header class="hero">
            <div class="hero-gloss"></div>
            
            <div class="check">
                <svg viewBox="0 0 52 52" class="check-svg">
                    <circle class="check-ring" cx="26" cy="26" r="24" />
                    <path class="check-mark" d="M16 27l6 6 14-14" />
                </svg>
            </div>
            
            <h1>✨ Service completed!</h1>
            <p class="sub">Your space is now sparkling clean! Thank you for choosing SparklePro.</p>
        </header>
        
        <article class="card">
            <div class="row">
                <div class="kv">
                    <span class="k">Order ID</span>
                    <span class="v">{{booking_number}}</span>
                </div>
                <span class="pill pill--completed">Completed</span>
            </div>
            
            <div class="grid">
                <div class="kv">
                    <span class="k">Customer</span>
                    <span class="v">{{customer_name}}</span>
                </div>
                <div class="kv">
                    <span class="k">Completed</span>
                    <span class="v">{{completion_time}}</span>
                </div>
                <div class="kv">
                    <span class="k">Service</span>
                    <span class="v">{{service_name}}</span>
                </div>
                <div class="kv">
                    <span class="k">Address</span>
                    <span class="v">{{service_address}}</span>
                </div>
            </div>
            
            <ol class="steps">
                <li class="done">
                    <span class="dot"></span>
                    <span class="txt">Created</span>
                </li>
                <li class="done">
                    <span class="dot"></span>
                    <span class="txt">Confirmed</span>
                </li>
                <li class="done">
                    <span class="dot"></span>
                    <span class="txt">In Progress</span>
                </li>
                <li class="current">
                    <span class="dot"></span>
                    <span class="txt">Completed</span>
                </li>
            </ol>
        </article>
        
        <div class="actions">
            <a href="{{app_url}}" class="btn btn--primary">Leave a Review</a>
            <a href="{{app_url}}" class="btn btn--ghost">Book Again</a>
        </div>
        
        <aside class="help">
            <div class="ico">
                <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 1 10 10l-5-5.5L12 22 7 16.5 2 22a10 10 0 0 1 10-20z"/></svg>
            </div>
            <p>How was your experience? <a href="mailto:sparklencs@gmail.com">Share feedback</a></p>
        </aside>
    </div>
</body>
</html>'
WHERE template_name = 'order_completed';

-- 4. Order Cancelled Template (when booking is cancelled)
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Cancelled - SparklePro</title>
    <style>
        :root{
            --primary:#ef4444; --accent:#dc2626; --violet:#b91c1c;
            --ink:#0f172a; --muted:#5b7a88; --line:#dbe8ee; --bg:#f7fbfd;
            --card:#fff; --shadow:0 12px 28px rgba(10,30,40,.10);
        }
        *{box-sizing:border-box}
        body{margin:0;background:var(--bg);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:12px}
        
        .order-success{max-width:520px;margin:0 auto;}
        
        .hero{
            position:relative;border-radius:22px;padding:22px 14px 18px;color:#fff;
            background: radial-gradient(120% 100% at 100% -20%, #fecaca 0%, transparent 55%),
                       radial-gradient(120% 100% at 0% 120%, #fed7d7 0%, transparent 60%),
                       linear-gradient(135deg, var(--primary), var(--accent));
            box-shadow: var(--shadow); overflow:hidden; text-align:center;
        }
        .hero-gloss{position:absolute;inset:-30% -10% auto -10%;height:70%;
            background:radial-gradient(closest-side, rgba(255,255,255,.55), transparent);
            mix-blend-mode:screen;pointer-events:none}
        
        .check{display:grid;place-items:center;margin:4px 0 6px}
        .check-svg{width:64px;height:64px}
        .cross{fill:none;stroke:#fff;stroke-width:4;stroke-linecap:round;stroke-dasharray:20;stroke-dashoffset:20;animation:draw .7s .15s ease forwards}
        @keyframes draw{to{stroke-dashoffset:0}}
        
        .hero h1{margin:4px 6px 6px;font-size:1.15rem;line-height:1.35;font-weight:900;letter-spacing:.2px;text-shadow:0 2px 12px rgba(0,0,0,.25)}
        .sub{margin:0 8px 6px;opacity:.95;font-size:0.9rem}
        
        .card{
            background:var(--card);border:1px solid var(--line);border-radius:18px;padding:12px;margin-top:12px;box-shadow:var(--shadow)
        }
        .row{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .kv{display:flex;flex-direction:column}
        .k{font-size:.78rem;color:#54727f;font-weight:800}
        .v{font-weight:900;color:var(--ink)}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
        .pill{
            display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;font-size:.78rem;font-weight:900;white-space:nowrap
        }
        .pill--cancelled{background:rgba(239,68,68,.18);color:#b91c1c;border:1px solid rgba(239,68,68,.45)}
        
        .actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
        .btn{border:0;border-radius:14px;padding:12px 14px;font-weight:900;cursor:pointer;transition:transform .12s ease,filter .2s ease;text-decoration:none;display:inline-block;text-align:center}
        .btn--primary{color:#fff;background:linear-gradient(135deg,#0ABDC6,#00E6B8);box-shadow:0 10px 24px rgba(10,189,198,.25)}
        .btn--ghost{background:#fff;border:1px solid var(--line);color:#08383c}
        
        .help{display:flex;align-items:center;gap:10px;margin:10px 2px}
        .help .ico{width:36px;height:36px;border-radius:12px;display:grid;place-items:center;background:rgba(239,68,68,.12);color:var(--primary)}
        .help a{color:#b91c1c;text-decoration:none;font-weight:800}
        
        @media (max-width:360px){ .grid{grid-template-columns:1fr} }
    </style>
</head>
<body>
    <div class="order-success">
        <header class="hero">
            <div class="hero-gloss"></div>
            
            <div class="check">
                <svg viewBox="0 0 52 52" class="check-svg">
                    <circle fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2" cx="26" cy="26" r="24" opacity="0.6"/>
                    <path class="cross" d="M16 16l20 20M36 16l-20 20"/>
                </svg>
            </div>
            
            <h1>Booking cancelled</h1>
            <p class="sub">We''ve processed your cancellation. We hope to serve you again soon!</p>
        </header>
        
        <article class="card">
            <div class="row">
                <div class="kv">
                    <span class="k">Order ID</span>
                    <span class="v">{{booking_number}}</span>
                </div>
                <span class="pill pill--cancelled">Cancelled</span>
            </div>
            
            <div class="grid">
                <div class="kv">
                    <span class="k">Customer</span>
                    <span class="v">{{customer_name}}</span>
                </div>
                <div class="kv">
                    <span class="k">Cancelled</span>
                    <span class="v">{{cancellation_time}}</span>
                </div>
                <div class="kv">
                    <span class="k">Service</span>
                    <span class="v">{{service_name}}</span>
                </div>
                <div class="kv">
                    <span class="k">Was scheduled for</span>
                    <span class="v">{{service_date}} at {{service_time}}</span>
                </div>
            </div>
        </article>
        
        <div class="actions">
            <a href="{{app_url}}" class="btn btn--primary">Book New Service</a>
            <a href="mailto:sparklencs@gmail.com" class="btn btn--ghost">Contact Support</a>
        </div>
        
        <aside class="help">
            <div class="ico">
                <svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 1 5 11.9V17a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-3.1A7 7 0 0 1 12 2Z"/><path d="M9 20h6"/></svg>
            </div>
            <p>Need assistance? <a href="mailto:sparklencs@gmail.com">We''re here to help</a></p>
        </aside>
    </div>
</body>
</html>'
WHERE template_name = 'order_cancelled';
