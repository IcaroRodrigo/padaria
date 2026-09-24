import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { SalesModule } from './sales/sales.module';
import { ExpensesModule } from './expenses/expenses.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SettingsModule } from './settings/settings.module';
import { DownloadsModule } from './downloads/downloads.module';
import { FiscalModule } from './fiscal/fiscal.module';
import { StockEntriesModule } from './stock-entries/stock-entries.module';
import { EmpresaModule } from './empresa/empresa.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CustomersModule,
    SuppliersModule,
    SalesModule,
    ExpensesModule,
    DashboardModule,
    SettingsModule,
    DownloadsModule,
    FiscalModule,
    StockEntriesModule,
    EmpresaModule,
  ],
})
export class AppModule {}
