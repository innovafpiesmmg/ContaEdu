import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingUp, DollarSign, Target, BarChart3, PieChart, Building } from "lucide-react";
import { motion } from "framer-motion";

function BreakEvenCalculator() {
  const [fixedCosts, setFixedCosts] = useState("");
  const [variableCostPerUnit, setVariableCostPerUnit] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");

  const fc = parseFloat(fixedCosts) || 0;
  const vc = parseFloat(variableCostPerUnit) || 0;
  const p = parseFloat(pricePerUnit) || 0;

  const margin = p - vc;
  const breakEvenUnits = margin > 0 ? Math.ceil(fc / margin) : 0;
  const breakEvenRevenue = breakEvenUnits * p;
  const marginPercent = p > 0 ? ((margin / p) * 100).toFixed(1) : "0";
  const hasResult = fc > 0 && margin > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Calculadora de Punto Muerto</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Costes Fijos Totales (EUR)</Label>
            <Input
              data-testid="input-fixed-costs"
              type="number"
              min="0"
              step="0.01"
              value={fixedCosts}
              onChange={e => setFixedCosts(e.target.value)}
              placeholder="15000"
            />
          </div>
          <div className="space-y-2">
            <Label>Coste Variable por Unidad (EUR)</Label>
            <Input
              data-testid="input-variable-cost"
              type="number"
              min="0"
              step="0.01"
              value={variableCostPerUnit}
              onChange={e => setVariableCostPerUnit(e.target.value)}
              placeholder="8"
            />
          </div>
          <div className="space-y-2">
            <Label>Precio de Venta por Unidad (EUR)</Label>
            <Input
              data-testid="input-price"
              type="number"
              min="0"
              step="0.01"
              value={pricePerUnit}
              onChange={e => setPricePerUnit(e.target.value)}
              placeholder="20"
            />
          </div>
        </div>

        {hasResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="bg-primary/5 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Margen de Contribucion</p>
              <p className="text-lg font-bold text-primary" data-testid="text-margin">{margin.toFixed(2)} EUR</p>
              <p className="text-[10px] text-muted-foreground">({marginPercent}%)</p>
            </div>
            <div className="bg-chart-1/5 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Punto Muerto (Uds)</p>
              <p className="text-lg font-bold text-chart-1" data-testid="text-breakeven-units">{breakEvenUnits.toLocaleString("es-ES")}</p>
            </div>
            <div className="bg-chart-4/5 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Punto Muerto (EUR)</p>
              <p className="text-lg font-bold text-chart-4" data-testid="text-breakeven-revenue">{breakEvenRevenue.toLocaleString("es-ES", { minimumFractionDigits: 2 })} EUR</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Ratio Coste/Precio</p>
              <p className="text-lg font-bold text-green-600" data-testid="text-cost-ratio">{p > 0 ? ((vc / p) * 100).toFixed(1) : 0}%</p>
            </div>
          </motion.div>
        )}

        <p className="text-xs text-muted-foreground pt-1">
          Formula: Punto Muerto = Costes Fijos / (Precio - Coste Variable por Unidad)
        </p>
      </CardContent>
    </Card>
  );
}

export default function AnaliticaPage() {
  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contabilidad Analitica</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Contabilidad de costes y gestion empresarial
        </p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">A. Que es la Contabilidad Analitica</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              La contabilidad analitica (o de costes) es una rama de la contabilidad que analiza los
              <strong className="text-foreground"> costes internos</strong> de la empresa para facilitar la toma de decisiones.
              Mientras la contabilidad financiera registra operaciones con el exterior (compras, ventas, cobros, pagos),
              la contabilidad analitica estudia como se distribuyen los costes dentro de la empresa.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">Contabilidad Financiera</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Obligatoria por ley</li>
                  <li>Registra operaciones externas</li>
                  <li>Orientada a terceros (Hacienda, bancos)</li>
                  <li>Sigue el PGC</li>
                </ul>
              </div>
              <div className="bg-chart-4/5 border border-chart-4/20 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">Contabilidad Analitica</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Voluntaria (gestion interna)</li>
                  <li>Analiza costes internos</li>
                  <li>Orientada a la direccion</li>
                  <li>No sigue normas fijas</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">B. Clasificacion de Costes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-3">Segun su relacion con la produccion</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-chart-2/5 border border-chart-2/20 rounded-lg p-4">
                  <h5 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                    <Badge variant="default" className="bg-chart-2">Costes Fijos</Badge>
                  </h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    No varian con el nivel de produccion.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Alquiler, seguros, sueldos fijos, amortizaciones
                  </p>
                </div>
                <div className="bg-chart-5/5 border border-chart-5/20 rounded-lg p-4">
                  <h5 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                    <Badge variant="default" className="bg-chart-5">Costes Variables</Badge>
                  </h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Aumentan o disminuyen con la produccion.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Materias primas, mano de obra directa, energia
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold text-sm mb-3">Segun su imputacion al producto</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h5 className="font-semibold text-sm mb-1">Costes Directos</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Se pueden asignar directamente a un producto o servicio.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Materias primas, mano de obra directa
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <h5 className="font-semibold text-sm mb-1">Costes Indirectos</h5>
                  <p className="text-sm text-muted-foreground mb-2">
                    Se deben repartir usando criterios de reparto (claves).
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Alquiler, supervision, mantenimiento general
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">C. Centros de Coste</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Un <strong className="text-foreground">centro de coste</strong> es una unidad organizativa de la empresa
              a la que se asignan costes para su control y analisis. Permite identificar donde se generan los costes
              y facilita la toma de decisiones.
            </p>
            <div className="space-y-2">
              {[
                { name: "Aprovisionamiento", desc: "Compras de materiales y almacenamiento", icon: "1" },
                { name: "Produccion / Fabricacion", desc: "Transformacion de materias primas en producto", icon: "2" },
                { name: "Distribucion / Comercial", desc: "Ventas, marketing, logistica de envios", icon: "3" },
                { name: "Administracion", desc: "Gestion general, contabilidad, RRHH", icon: "4" },
              ].map(c => (
                <div key={c.name} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors">
                  <span className="w-8 h-8 flex items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-sm shrink-0">
                    {c.icon}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">D. El Punto Muerto o Umbral de Rentabilidad</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              El <strong className="text-foreground">punto muerto</strong> (o punto de equilibrio, break-even) es el nivel
              de ventas en el que la empresa no tiene ni beneficios ni perdidas. Los ingresos totales igualan a los costes totales.
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <p className="text-sm font-semibold text-primary mb-2">Formula del Punto Muerto</p>
              <p className="text-lg font-mono">
                Q* = CF / (PVu - CVu)
              </p>
              <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                <p>Q* = Unidades en el punto muerto</p>
                <p>CF = Costes Fijos totales</p>
                <p>PVu = Precio de Venta unitario</p>
                <p>CVu = Coste Variable unitario</p>
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Interpretacion</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-destructive font-bold shrink-0">Q &lt; Q*</span>
                  <span>Ventas por debajo del punto muerto = <strong className="text-destructive">PERDIDAS</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold shrink-0">Q = Q*</span>
                  <span>Ventas en el punto muerto = <strong className="text-amber-500">EQUILIBRIO</strong> (Beneficio = 0)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold shrink-0">Q &gt; Q*</span>
                  <span>Ventas por encima del punto muerto = <strong className="text-green-600">BENEFICIOS</strong></span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <BreakEvenCalculator />

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">E. Margen de Contribucion</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              El <strong className="text-foreground">margen de contribucion</strong> es la diferencia entre el precio de venta
              y el coste variable unitario. Representa la cantidad que cada unidad vendida aporta para cubrir los costes fijos.
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <p className="text-lg font-mono">
                MC = PVu - CVu
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Ejemplo Practico</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Una empresa fabrica sillas con precio de venta de 80 EUR, coste variable de 45 EUR y costes fijos de 21.000 EUR mensuales.
              </p>
              <div className="space-y-1 text-sm">
                <p>Margen de Contribucion = 80 - 45 = <strong>35 EUR/ud</strong></p>
                <p>Punto Muerto = 21.000 / 35 = <strong>600 sillas/mes</strong></p>
                <p>Ingresos en Punto Muerto = 600 x 80 = <strong>48.000 EUR</strong></p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">F. Modelos de Costes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">Full Costing (Costes Completos)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Asigna <strong className="text-foreground">todos</strong> los costes (fijos y variables) al producto.
                </p>
                <Badge variant="secondary" className="text-[10px]">Coste producto = CV + CF repartidos</Badge>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">Direct Costing (Costes Variables)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Solo asigna los <strong className="text-foreground">costes variables</strong> al producto.
                  Los fijos van al resultado del periodo.
                </p>
                <Badge variant="secondary" className="text-[10px]">Coste producto = Solo CV</Badge>
              </div>
            </div>

            <Separator />

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">Concepto</th>
                    <th className="text-center py-2 px-4 font-medium">Full Costing</th>
                    <th className="text-center py-2 pl-4 font-medium">Direct Costing</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 pr-4 text-muted-foreground">Costes variables</td>
                    <td className="text-center py-2 px-4">Al producto</td>
                    <td className="text-center py-2 pl-4">Al producto</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 text-muted-foreground">Costes fijos</td>
                    <td className="text-center py-2 px-4">Al producto (repartidos)</td>
                    <td className="text-center py-2 pl-4">Al periodo</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 text-muted-foreground">Valoracion existencias</td>
                    <td className="text-center py-2 px-4">Mayor</td>
                    <td className="text-center py-2 pl-4">Menor</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-muted-foreground">Util para</td>
                    <td className="text-center py-2 px-4">Fijar precios</td>
                    <td className="text-center py-2 pl-4">Decisiones corto plazo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
