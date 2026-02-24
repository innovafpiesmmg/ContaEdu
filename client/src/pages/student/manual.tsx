import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpenText, Scale, ArrowLeftRight, Receipt, Calculator, Building } from "lucide-react";
import { motion } from "framer-motion";

export default function ManualPage() {
  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Manual de Contabilidad</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Referencia rapida de contabilidad para CFGM/CFGS
        </p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">A. Ecuacion Fundamental del Patrimonio</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
              <p className="text-lg font-semibold text-primary">
                ACTIVO = PASIVO + PATRIMONIO NETO
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Esta es la base de toda la contabilidad por partida doble. Todo lo que tiene la empresa
              (Activo) se financia con deuda (Pasivo) o con fondos propios (Patrimonio Neto).
              Esta ecuacion debe cumplirse siempre.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">B. Funcionamiento de las Cuentas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-chart-1/5 border border-chart-1/20 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                  <Badge variant="default" className="bg-chart-1">Activo</Badge>
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>Nacen y aumentan por el <strong className="text-foreground">Debe</strong> (izquierda)</li>
                  <li>Disminuyen por el <strong className="text-foreground">Haber</strong> (derecha)</li>
                </ul>
              </div>
              <div className="bg-chart-2/5 border border-chart-2/20 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                  <Badge variant="default" className="bg-chart-2">Pasivo y Neto</Badge>
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>Nacen y aumentan por el <strong className="text-foreground">Haber</strong> (derecha)</li>
                  <li>Disminuyen por el <strong className="text-foreground">Debe</strong> (izquierda)</li>
                </ul>
              </div>
              <div className="bg-chart-5/5 border border-chart-5/20 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                  <Badge variant="default" className="bg-chart-5">Gastos (Grupo 6)</Badge>
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>Siempre se <strong className="text-foreground">cargan (Debe)</strong></li>
                  <li>Excepto en la regularizacion</li>
                </ul>
              </div>
              <div className="bg-chart-4/5 border border-chart-4/20 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                  <Badge variant="default" className="bg-chart-4">Ingresos (Grupo 7)</Badge>
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>Siempre se <strong className="text-foreground">abonan (Haber)</strong></li>
                  <li>Excepto en la regularizacion</li>
                </ul>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold text-sm mb-3">Regla Nemotecnica - Estructura en T</h4>
              <div className="border rounded-lg overflow-hidden max-w-sm mx-auto">
                <div className="grid grid-cols-2 text-center">
                  <div className="bg-muted/50 border-r border-b px-4 py-2 font-semibold text-sm">DEBE</div>
                  <div className="bg-muted/50 border-b px-4 py-2 font-semibold text-sm">HABER</div>
                  <div className="border-r px-4 py-3 text-sm">
                    <p className="text-chart-1">+ Activo</p>
                    <p className="text-chart-5">+ Gastos</p>
                    <p className="text-chart-2">- Pasivo</p>
                    <p className="text-chart-3">- Neto</p>
                  </div>
                  <div className="px-4 py-3 text-sm">
                    <p className="text-chart-1">- Activo</p>
                    <p className="text-chart-4">+ Ingresos</p>
                    <p className="text-chart-2">+ Pasivo</p>
                    <p className="text-chart-3">+ Neto</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">C. El IVA y el IGIC</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">IVA/IGIC Soportado (Compras)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Es un <strong className="text-foreground">derecho</strong> frente a Hacienda (Activo).
                </p>
                <p className="text-sm">
                  Se anota en el <strong>Debe</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  Cuenta: 472 - H.P. IVA Soportado
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">IVA/IGIC Repercutido (Ventas)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Es una <strong className="text-foreground">obligacion</strong> frente a Hacienda (Pasivo).
                </p>
                <p className="text-sm">
                  Se anota en el <strong>Haber</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  Cuenta: 477 - H.P. IVA Repercutido
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold text-sm mb-3">Tipos Impositivos</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium">Tipo</th>
                      <th className="text-right py-2 px-4 font-medium">IVA</th>
                      <th className="text-right py-2 pl-4 font-medium">IGIC</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 pr-4 text-muted-foreground">General</td>
                      <td className="text-right py-2 px-4 font-mono">21%</td>
                      <td className="text-right py-2 pl-4 font-mono">7%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 text-muted-foreground">Reducido</td>
                      <td className="text-right py-2 px-4 font-mono">10%</td>
                      <td className="text-right py-2 pl-4 font-mono">3%</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 text-muted-foreground">Superreducido</td>
                      <td className="text-right py-2 px-4 font-mono">4%</td>
                      <td className="text-right py-2 pl-4 font-mono">0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">D. Estructura del Plan General de Contabilidad</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { group: "1", name: "Financiacion Basica", desc: "Capital, reservas, deudas a largo plazo", type: "Pasivo / Neto" },
                { group: "2", name: "Activo No Corriente", desc: "Inmovilizado material, intangible, amortizaciones", type: "Activo" },
                { group: "3", name: "Existencias", desc: "Mercaderias, materias primas, productos", type: "Activo" },
                { group: "4", name: "Acreedores y Deudores", desc: "Proveedores, clientes, Hacienda Publica", type: "Activo / Pasivo" },
                { group: "5", name: "Cuentas Financieras", desc: "Bancos, caja, deudas a corto plazo", type: "Activo / Pasivo" },
                { group: "6", name: "Compras y Gastos", desc: "Compras, sueldos, servicios, amortizaciones", type: "Gasto" },
                { group: "7", name: "Ventas e Ingresos", desc: "Ventas, prestacion de servicios, ingresos financieros", type: "Ingreso" },
              ].map(g => (
                <div key={g.group} className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors">
                  <span className="w-8 h-8 flex items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-sm shrink-0">
                    {g.group}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{g.desc}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{g.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">E. Ejemplo Practico: Compra de Mercaderias</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              La empresa ALFA, S.L. compra mercaderias por 2.000 EUR + 21% IVA.
              Paga el 50% por banco y el resto queda pendiente (proveedor).
            </p>

            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm mb-2">Asiento contable:</h4>
              <div className="border rounded-md overflow-hidden">
                <div className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-0 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-2">
                  <span>Cuenta</span>
                  <span>Concepto</span>
                  <span className="text-right">Debe</span>
                  <span className="text-right">Haber</span>
                </div>
                {[
                  { code: "600", name: "Compras de mercaderias", debit: "2.000,00", credit: "" },
                  { code: "472", name: "H.P. IVA Soportado (21%)", debit: "420,00", credit: "" },
                  { code: "572", name: "Bancos c/c (50%)", debit: "", credit: "1.210,00" },
                  { code: "400", name: "Proveedores (50%)", debit: "", credit: "1.210,00" },
                ].map((line, i) => (
                  <div key={i} className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-0 text-sm px-3 py-2 border-t">
                    <span className="font-mono text-muted-foreground">{line.code}</span>
                    <span>{line.name}</span>
                    <span className="text-right font-mono">{line.debit}</span>
                    <span className="text-right font-mono">{line.credit}</span>
                  </div>
                ))}
                <div className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-0 text-sm font-semibold px-3 py-2 border-t bg-muted/30">
                  <span />
                  <span>TOTALES</span>
                  <span className="text-right font-mono">2.420,00</span>
                  <span className="text-right font-mono">2.420,00</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="default" className="bg-green-600 text-[10px]">Cuadrado</Badge>
              <span>Total Debe = Total Haber = 2.420,00 EUR</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpenText className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">F. Los Libros Contables</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-1">Libro Diario</h4>
                <p className="text-sm text-muted-foreground">
                  Registra <strong className="text-foreground">cronologicamente</strong> todas las operaciones de la empresa.
                  Cada operacion se anota como un asiento contable con su fecha, concepto
                  y las cuentas afectadas con sus importes al Debe y al Haber.
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-1">Libro Mayor</h4>
                <p className="text-sm text-muted-foreground">
                  Recoge los movimientos de <strong className="text-foreground">cada cuenta</strong> de forma individual
                  (formato T). Muestra todas las anotaciones al Debe y al Haber de una cuenta,
                  permitiendo calcular su saldo en cualquier momento.
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-1">Balance de Comprobacion (Sumas y Saldos)</h4>
                <p className="text-sm text-muted-foreground">
                  Resume las <strong className="text-foreground">sumas</strong> del Debe y Haber de todas las cuentas
                  y calcula su <strong className="text-foreground">saldo</strong> (deudor o acreedor).
                  Sirve para verificar que la contabilidad cuadra correctamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
